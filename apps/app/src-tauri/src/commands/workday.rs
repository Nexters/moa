//! Workday 캐시 관리 + 서버 동기화.
//!
//! See: `apps/app/docs/patterns/server-sync.md`
//!
//! 책임:
//! - 로컬 캐시(`recovery/workday/{date}.json`) read/write
//! - 서버 GET 응답 ↔ `WorkdayCache` 양방향 매핑
//! - `fetch_workday`: 서버 우선 hydrate (`is_dirty=true`면 무시)
//!
//! Write sync(`mutate_workday`)와 retry queue는 후속 단계에서 추가된다.

use std::path::PathBuf;

use tauri::{AppHandle, Emitter, Manager};

use crate::api_client::{
    ApiClient, ApiError, WorkdayEvent as ApiWorkdayEvent, WorkdayResponse, WorkdayStatus,
    WorkdayType, WorkdayUpsertRequest,
};
use crate::auth;
use crate::salary;
use crate::types::{WorkdayCache, WorkdayCacheEvent, WorkdayKind};

fn workday_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir 조회 실패: {e}"))?;
    let dir = app_data_dir.join("recovery").join("workday");
    std::fs::create_dir_all(&dir).map_err(|e| format!("workday 디렉토리 생성 실패: {e}"))?;
    Ok(dir)
}

fn cache_path(app: &AppHandle, date: &str) -> Result<PathBuf, String> {
    Ok(workday_dir(app)?.join(format!("{date}.json")))
}

/// 로컬 캐시 로드. 파일 없으면 `Ok(None)`.
pub fn load_workday_cache(app: &AppHandle, date: &str) -> Result<Option<WorkdayCache>, String> {
    let path = cache_path(app, date)?;
    if !path.exists() {
        return Ok(None);
    }
    let contents = std::fs::read_to_string(&path).map_err(|e| format!("cache read 실패: {e}"))?;
    let cache: WorkdayCache =
        serde_json::from_str(&contents).map_err(|e| format!("cache parse 실패: {e}"))?;
    Ok(Some(cache))
}

/// 로컬 캐시 저장 (원자적 write — `.tmp` → rename).
pub fn save_workday_cache(app: &AppHandle, cache: &WorkdayCache) -> Result<(), String> {
    let path = cache_path(app, &cache.date)?;
    let content =
        serde_json::to_string_pretty(cache).map_err(|e| format!("cache 직렬화 실패: {e}"))?;
    let temp = path.with_extension("tmp");
    std::fs::write(&temp, content).map_err(|e| format!("임시 파일 write 실패: {e}"))?;
    std::fs::rename(&temp, &path).map_err(|e| {
        let _ = std::fs::remove_file(&temp);
        format!("rename 실패: {e}")
    })?;
    Ok(())
}

/// 서버 응답 → 캐시 매핑.
///
/// `kind` 결정 규칙: `events`에 `PUBLIC_HOLIDAY` 있으면 우선. 아니면 `type`으로 매핑.
pub fn response_to_cache(response: WorkdayResponse) -> WorkdayCache {
    let events: Vec<WorkdayCacheEvent> = response
        .events
        .iter()
        .map(|e| match e {
            ApiWorkdayEvent::Payday => WorkdayCacheEvent::Payday,
            ApiWorkdayEvent::PublicHoliday => WorkdayCacheEvent::PublicHoliday,
        })
        .collect();

    let kind = if events.contains(&WorkdayCacheEvent::PublicHoliday) {
        WorkdayKind::PublicHoliday
    } else {
        match response.workday_type {
            WorkdayType::Work => WorkdayKind::Work,
            WorkdayType::Vacation => WorkdayKind::AnnualLeave,
            WorkdayType::None => WorkdayKind::DayOff,
        }
    };

    WorkdayCache {
        date: response.date,
        kind,
        clock_in_time: response.clock_in_time,
        clock_out_time: response.clock_out_time,
        completed: response.status == WorkdayStatus::Completed,
        events,
        is_dirty: false,
    }
}

/// 캐시 → 서버 PUT body.
///
/// `PublicHoliday`는 사용자가 직접 토글하는 종류가 아니므로 안전한 default(`WORK`)로 매핑.
/// 서버가 events를 자동 관리한다는 가정.
pub fn cache_to_upsert(cache: &WorkdayCache) -> WorkdayUpsertRequest {
    let workday_type = match cache.kind {
        WorkdayKind::Work => WorkdayType::Work,
        WorkdayKind::AnnualLeave => WorkdayType::Vacation,
        WorkdayKind::DayOff => WorkdayType::None,
        WorkdayKind::PublicHoliday => WorkdayType::Work,
    };
    WorkdayUpsertRequest {
        workday_type,
        clock_in_time: cache.clock_in_time.clone(),
        clock_out_time: cache.clock_out_time.clone(),
    }
}

fn empty_cache(date: &str) -> WorkdayCache {
    WorkdayCache {
        date: date.to_string(),
        kind: WorkdayKind::Work,
        clock_in_time: None,
        clock_out_time: None,
        completed: false,
        events: vec![],
        is_dirty: false,
    }
}

/// 서버 GET → 로컬 캐시 hydrate.
///
/// 흐름:
/// 1. 비로그인 → 로컬 캐시 그대로 반환
/// 2. 서버 GET 실패(401/네트워크) → 로컬 캐시 fallback
/// 3. 로컬 `is_dirty=true` → 서버 응답 무시
/// 4. 그 외 → 서버 응답으로 덮어쓰기 + `workday-changed` emit + ticker 재로드 신호
#[tauri::command]
#[specta::specta]
pub async fn fetch_workday(app: AppHandle, date: String) -> Result<WorkdayCache, String> {
    let token = match auth::get_access_token(&app) {
        Some(t) => t,
        None => {
            log::debug!("fetch_workday: 비로그인 — 로컬 캐시만 사용 ({date})");
            return Ok(load_workday_cache(&app, &date)?.unwrap_or_else(|| empty_cache(&date)));
        }
    };

    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());
    let api = ApiClient::new(&base_url);

    let response = match api.get_workday(&token, &date).await {
        Ok(r) => r,
        Err(ApiError::Unauthorized) => {
            log::info!("fetch_workday: 401 — 토큰 clear + 로컬 캐시 fallback");
            auth::clear_auth_token(&app);
            return Ok(load_workday_cache(&app, &date)?.unwrap_or_else(|| empty_cache(&date)));
        }
        Err(e) => {
            log::warn!("fetch_workday: 서버 조회 실패 ({date}) — 로컬 캐시 사용: {e}");
            return Ok(load_workday_cache(&app, &date)?.unwrap_or_else(|| empty_cache(&date)));
        }
    };

    let server_cache = response_to_cache(response);

    if let Some(local) = load_workday_cache(&app, &date)? {
        if local.is_dirty {
            log::info!("fetch_workday: 로컬 dirty ({date}) — 서버 응답 무시");
            return Ok(local);
        }
    }

    save_workday_cache(&app, &server_cache)?;
    let _ = app.emit("workday-changed", &date);
    salary::notify_settings_changed();

    Ok(server_cache)
}

/// 사용자 액션 → 로컬 즉시 update + 서버 PUT.
///
/// 흐름:
/// 1. 로컬 cache 즉시 write + `is_dirty=true` (낙관적)
/// 2. `notify_settings_changed` + `workday-changed` emit (ticker/UI 즉시 반영)
/// 3. 서버 PUT
///    - 성공 → `is_dirty=false`
///    - 4xx → 로컬 dirty 유지 (다음 polling이 GET으로 복원)
///    - 5xx/네트워크 → 큐 적재 (Task: retry queue 단계에서 구현)
///
/// `events`는 변경 안 함 — 기존 cache의 events를 보존. 서버가 자동 관리하는
/// PUBLIC_HOLIDAY/PAYDAY 등은 다음 polling으로 정렬된다.
#[tauri::command]
#[specta::specta]
pub async fn mutate_workday(
    app: AppHandle,
    date: String,
    kind: WorkdayKind,
    clock_in_time: Option<String>,
    clock_out_time: Option<String>,
    completed: bool,
) -> Result<WorkdayCache, String> {
    // 기존 events 보존
    let prior_events = load_workday_cache(&app, &date)?
        .map(|c| c.events)
        .unwrap_or_default();

    // 1. 낙관적 local write
    let mut cache = WorkdayCache {
        date: date.clone(),
        kind,
        clock_in_time,
        clock_out_time,
        completed,
        events: prior_events,
        is_dirty: true,
    };
    save_workday_cache(&app, &cache)?;
    salary::notify_settings_changed();
    let _ = app.emit("workday-changed", &date);

    // 2. 서버 PUT
    let token = match auth::get_access_token(&app) {
        Some(t) => t,
        None => {
            log::info!("mutate_workday: 비로그인 — 큐 적재 보류 (retry queue 단계에서 구현)");
            return Ok(cache);
        }
    };

    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());
    let api = ApiClient::new(&base_url);
    let req = cache_to_upsert(&cache);

    match api.put_workday(&token, &date, &req).await {
        Ok(()) => {
            cache.is_dirty = false;
            save_workday_cache(&app, &cache)?;
            log::debug!("mutate_workday 성공 ({date})");
        }
        Err(ApiError::Unauthorized) => {
            log::info!("mutate_workday: 401 — 토큰 clear + 큐 적재 보류");
            auth::clear_auth_token(&app);
        }
        Err(ApiError::Server(msg)) => {
            log::warn!("mutate_workday: 서버 4xx ({date}) — 다음 polling이 GET으로 복원: {msg}");
        }
        Err(e) => {
            log::warn!("mutate_workday: 네트워크/5xx ({date}) — 큐 적재 보류: {e}");
        }
    }

    Ok(cache)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api_client::{WorkdayEvent as ApiWorkdayEvent, WorkdayResponse, WorkdayStatus};

    fn response(
        workday_type: WorkdayType,
        status: WorkdayStatus,
        events: Vec<ApiWorkdayEvent>,
    ) -> WorkdayResponse {
        WorkdayResponse {
            date: "2026-05-25".into(),
            workday_type,
            status,
            events,
            daily_pay: 0,
            clock_in_time: None,
            clock_out_time: None,
        }
    }

    #[test]
    fn type_none_maps_to_day_off() {
        let c = response_to_cache(response(WorkdayType::None, WorkdayStatus::None, vec![]));
        assert_eq!(c.kind, WorkdayKind::DayOff);
    }

    #[test]
    fn type_vacation_maps_to_annual_leave() {
        let c = response_to_cache(response(WorkdayType::Vacation, WorkdayStatus::None, vec![]));
        assert_eq!(c.kind, WorkdayKind::AnnualLeave);
    }

    #[test]
    fn type_work_maps_to_work() {
        let c = response_to_cache(response(WorkdayType::Work, WorkdayStatus::None, vec![]));
        assert_eq!(c.kind, WorkdayKind::Work);
    }

    #[test]
    fn public_holiday_event_overrides_type() {
        let c = response_to_cache(response(
            WorkdayType::Work,
            WorkdayStatus::None,
            vec![ApiWorkdayEvent::PublicHoliday],
        ));
        assert_eq!(c.kind, WorkdayKind::PublicHoliday);
        assert_eq!(c.events, vec![WorkdayCacheEvent::PublicHoliday]);
    }

    #[test]
    fn status_completed_sets_completed_flag() {
        let c = response_to_cache(response(WorkdayType::Work, WorkdayStatus::Completed, vec![]));
        assert!(c.completed);
    }

    #[test]
    fn fresh_cache_from_response_is_not_dirty() {
        let c = response_to_cache(response(WorkdayType::Work, WorkdayStatus::None, vec![]));
        assert!(!c.is_dirty);
    }

    #[test]
    fn payday_event_preserved_but_does_not_change_kind() {
        let c = response_to_cache(response(
            WorkdayType::Work,
            WorkdayStatus::None,
            vec![ApiWorkdayEvent::Payday],
        ));
        assert_eq!(c.kind, WorkdayKind::Work);
        assert_eq!(c.events, vec![WorkdayCacheEvent::Payday]);
    }

    #[test]
    fn cache_to_upsert_day_off_uses_type_none() {
        let cache = WorkdayCache {
            date: "2026-05-25".into(),
            kind: WorkdayKind::DayOff,
            clock_in_time: None,
            clock_out_time: None,
            completed: false,
            events: vec![],
            is_dirty: true,
        };
        let req = cache_to_upsert(&cache);
        assert_eq!(req.workday_type, WorkdayType::None);
        assert!(req.clock_in_time.is_none());
    }

    #[test]
    fn cache_to_upsert_annual_leave_uses_type_vacation() {
        let cache = WorkdayCache {
            date: "2026-05-25".into(),
            kind: WorkdayKind::AnnualLeave,
            clock_in_time: None,
            clock_out_time: None,
            completed: false,
            events: vec![],
            is_dirty: true,
        };
        let req = cache_to_upsert(&cache);
        assert_eq!(req.workday_type, WorkdayType::Vacation);
    }

    #[test]
    fn cache_to_upsert_work_carries_times() {
        let cache = WorkdayCache {
            date: "2026-05-25".into(),
            kind: WorkdayKind::Work,
            clock_in_time: Some("09:00".into()),
            clock_out_time: Some("18:00".into()),
            completed: false,
            events: vec![],
            is_dirty: true,
        };
        let req = cache_to_upsert(&cache);
        assert_eq!(req.workday_type, WorkdayType::Work);
        assert_eq!(req.clock_in_time.as_deref(), Some("09:00"));
        assert_eq!(req.clock_out_time.as_deref(), Some("18:00"));
    }
}
