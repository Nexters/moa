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
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Emitter, Manager};

use crate::api_client::{
    ApiClient, ApiError, WorkdayEvent as ApiWorkdayEvent, WorkdayResponse, WorkdayStatus,
    WorkdayType, WorkdayUpsertRequest,
};
use crate::auth;
use crate::salary;
use crate::types::{WorkdayCache, WorkdayCacheEvent, WorkdayKind};

const SYNC_QUEUE_FILENAME: &str = "sync-queue.json";
const MAX_RETRIES: u32 = 5;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum SyncQueueKind {
    PutWorkday,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SyncQueueEntry {
    pub id: String,
    pub kind: SyncQueueKind,
    pub date: String,
    pub payload: SerializedUpsert,
    pub attempts: u32,
    pub last_error: Option<String>,
}

/// `WorkdayUpsertRequest`의 직렬화 가능 미러.
/// (api_client::WorkdayUpsertRequest는 Serialize만 derive해 큐 저장 불가)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SerializedUpsert {
    #[serde(rename = "type")]
    pub workday_type: WorkdayTypeMirror,
    pub clock_in_time: Option<String>,
    pub clock_out_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum WorkdayTypeMirror {
    Work,
    Vacation,
    None,
}

impl From<&WorkdayUpsertRequest> for SerializedUpsert {
    fn from(req: &WorkdayUpsertRequest) -> Self {
        let workday_type = match req.workday_type {
            WorkdayType::Work => WorkdayTypeMirror::Work,
            WorkdayType::Vacation => WorkdayTypeMirror::Vacation,
            WorkdayType::None => WorkdayTypeMirror::None,
        };
        Self {
            workday_type,
            clock_in_time: req.clock_in_time.clone(),
            clock_out_time: req.clock_out_time.clone(),
        }
    }
}

impl SerializedUpsert {
    fn to_request(&self) -> WorkdayUpsertRequest {
        let workday_type = match self.workday_type {
            WorkdayTypeMirror::Work => WorkdayType::Work,
            WorkdayTypeMirror::Vacation => WorkdayType::Vacation,
            WorkdayTypeMirror::None => WorkdayType::None,
        };
        WorkdayUpsertRequest {
            workday_type,
            clock_in_time: self.clock_in_time.clone(),
            clock_out_time: self.clock_out_time.clone(),
        }
    }
}

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

// ============================================================================
// Retry queue
// ============================================================================

fn sync_queue_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir 조회 실패: {e}"))?
        .join("recovery");
    std::fs::create_dir_all(&dir).map_err(|e| format!("recovery dir 생성 실패: {e}"))?;
    Ok(dir.join(SYNC_QUEUE_FILENAME))
}

fn load_sync_queue(app: &AppHandle) -> Vec<SyncQueueEntry> {
    let Ok(path) = sync_queue_path(app) else {
        return vec![];
    };
    if !path.exists() {
        return vec![];
    }
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_sync_queue(app: &AppHandle, queue: &[SyncQueueEntry]) -> Result<(), String> {
    let path = sync_queue_path(app)?;
    let content =
        serde_json::to_string_pretty(queue).map_err(|e| format!("큐 직렬화 실패: {e}"))?;
    let temp = path.with_extension("tmp");
    std::fs::write(&temp, content).map_err(|e| format!("큐 임시 write 실패: {e}"))?;
    std::fs::rename(&temp, &path).map_err(|e| {
        let _ = std::fs::remove_file(&temp);
        format!("큐 rename 실패: {e}")
    })?;
    Ok(())
}

fn generate_id() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| format!("{}", d.as_nanos()))
        .unwrap_or_else(|_| "unknown".to_string())
}

/// 큐에 항목 추가. 같은 날짜 항목이 있으면 교체(attempts 누적).
pub(crate) fn enqueue_sync_failure(
    app: &AppHandle,
    cache: &WorkdayCache,
    error: &str,
) -> Result<(), String> {
    let mut queue = load_sync_queue(app);
    let existing_attempts = queue
        .iter()
        .find(|e| e.date == cache.date)
        .map(|e| e.attempts)
        .unwrap_or(0);
    queue.retain(|e| e.date != cache.date);

    let payload = SerializedUpsert::from(&cache_to_upsert(cache));
    queue.push(SyncQueueEntry {
        id: generate_id(),
        kind: SyncQueueKind::PutWorkday,
        date: cache.date.clone(),
        payload,
        attempts: existing_attempts,
        last_error: Some(error.to_string()),
    });

    save_sync_queue(app, &queue)
}

fn is_retryable_server_error(status: u16) -> bool {
    status >= 500
}

async fn sync_dirty_workday_cache(
    app: &AppHandle,
    date: &str,
    cache: &mut WorkdayCache,
) -> Result<(), String> {
    if auth::get_access_token(app).is_none() {
        log::info!("sync_dirty_workday_cache: 비로그인 ({date}) — 큐 적재");
        enqueue_sync_failure(app, cache, "no-token")?;
        return Ok(());
    }

    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());
    let req = cache_to_upsert(cache);

    let put_result = auth::with_token_retry(app, {
        let base_url = base_url.clone();
        let date = date.to_string();
        let req = req.clone();
        move |token| {
            let base_url = base_url.clone();
            let date = date.clone();
            let req = req.clone();
            Box::pin(async move {
                ApiClient::new(&base_url)
                    .put_workday(&token, &date, &req)
                    .await
            })
        }
    })
    .await;

    match put_result {
        Ok(()) => {
            cache.is_dirty = false;
            save_workday_cache(app, cache)?;
            log::debug!("sync_dirty_workday_cache 성공 ({date})");
        }
        Err(ApiError::Unauthorized) => {
            // refresh 최종 실패 → finalize_expired가 이미 clear + emit. 큐 적재.
            log::info!("sync_dirty_workday_cache: 세션 만료 ({date}) — 큐 적재");
            enqueue_sync_failure(app, cache, "unauthorized")?;
        }
        Err(ApiError::Server { status, message }) if !is_retryable_server_error(status) => {
            log::warn!("sync_dirty_workday_cache: 서버 4xx ({date}) — 서버 상태로 복원: {message}");
            // refresh 후 갱신됐을 수 있으니 유효 토큰 재조회
            let Some(token) = auth::get_access_token(app) else {
                log::info!("sync_dirty_workday_cache: 4xx 복원 중 비로그인 — 큐 적재");
                enqueue_sync_failure(app, cache, "unauthorized")?;
                return Ok(());
            };
            let api = ApiClient::new(&base_url);
            match api.get_workday(&token, date).await {
                Ok(response) => {
                    *cache = response_to_cache(response);
                    save_workday_cache(app, cache)?;
                    salary::notify_settings_changed();
                    let _ = app.emit("workday-changed", date);
                }
                Err(e) => {
                    log::warn!(
                        "sync_dirty_workday_cache: 4xx 복원 GET 실패 ({date}) — 다음 polling에 위임: {e}"
                    );
                    cache.is_dirty = false;
                    save_workday_cache(app, cache)?;
                }
            }
        }
        Err(e) => {
            log::warn!("sync_dirty_workday_cache: 네트워크/5xx ({date}) — 큐 적재: {e}");
            enqueue_sync_failure(app, cache, &format!("{e}"))?;
        }
    }

    Ok(())
}

/// 큐의 모든 항목 재전송 시도.
/// - 성공 → 큐에서 제거 + 해당 cache `is_dirty=false`
/// - 401 → 큐 보존, 다음 로그인 후 재시도
/// - 최대 시도(`MAX_RETRIES`) 초과 → 큐에서 제거 (사용자 알림은 후속 PR)
pub async fn flush_sync_queue(app: &AppHandle) -> Result<(), String> {
    if auth::get_access_token(app).is_none() {
        log::debug!("flush_sync_queue: 비로그인 — skip");
        return Ok(());
    }

    let queue = load_sync_queue(app);
    if queue.is_empty() {
        return Ok(());
    }
    log::info!("flush_sync_queue: {} entries", queue.len());

    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());

    let mut remaining: Vec<SyncQueueEntry> = Vec::new();
    let mut auth_failure = false;
    for mut entry in queue {
        if auth_failure {
            remaining.push(entry);
            continue;
        }
        let request = entry.payload.to_request();
        // 각 PUT을 래핑 — 첫 항목이 refresh하면 이후 항목은 갱신된 토큰 사용(refresh는 1회).
        let put_result = auth::with_token_retry(app, {
            let base_url = base_url.clone();
            let date = entry.date.clone();
            let request = request.clone();
            move |token| {
                let base_url = base_url.clone();
                let date = date.clone();
                let request = request.clone();
                Box::pin(async move {
                    ApiClient::new(&base_url)
                        .put_workday(&token, &date, &request)
                        .await
                })
            }
        })
        .await;
        match put_result {
            Ok(()) => {
                log::info!("flush_sync_queue: PUT {} 성공", entry.date);
                if let Ok(Some(mut cache)) = load_workday_cache(app, &entry.date) {
                    cache.is_dirty = false;
                    let _ = save_workday_cache(app, &cache);
                }
            }
            Err(ApiError::Unauthorized) => {
                // refresh 최종 실패 → finalize_expired가 이미 clear + emit. 나머지 큐 보존.
                log::info!("flush_sync_queue: 세션 만료 — 큐 보존");
                auth_failure = true;
                remaining.push(entry);
            }
            Err(e) => {
                entry.attempts += 1;
                entry.last_error = Some(format!("{e}"));
                if entry.attempts >= MAX_RETRIES {
                    log::warn!(
                        "flush_sync_queue: {} 최대 시도({}) 초과 — 큐에서 제거",
                        entry.date,
                        MAX_RETRIES
                    );
                } else {
                    log::warn!(
                        "flush_sync_queue: {} 실패 ({}/{}회): {e}",
                        entry.date,
                        entry.attempts,
                        MAX_RETRIES
                    );
                    remaining.push(entry);
                }
            }
        }
    }

    save_sync_queue(app, &remaining)
}

/// 로그아웃 시 큐 클리어 — 다른 사용자가 같은 디바이스에 로그인했을 때
/// 이전 사용자의 미동기 액션이 전송되지 않도록.
pub fn clear_sync_queue(app: &AppHandle) -> Result<(), String> {
    let path = sync_queue_path(app)?;
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| format!("큐 삭제 실패: {e}"))?;
    }
    Ok(())
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
    if auth::get_access_token(&app).is_none() {
        log::debug!("fetch_workday: 비로그인 — 로컬 캐시만 사용 ({date})");
        return Ok(load_workday_cache(&app, &date)?.unwrap_or_else(|| empty_cache(&date)));
    }

    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());

    let result = auth::with_token_retry(&app, {
        let base_url = base_url.clone();
        let date = date.clone();
        move |token| {
            let base_url = base_url.clone();
            let date = date.clone();
            Box::pin(async move { ApiClient::new(&base_url).get_workday(&token, &date).await })
        }
    })
    .await;

    let response = match result {
        Ok(r) => r,
        Err(ApiError::Unauthorized) => {
            // refresh 최종 실패 → finalize_expired가 이미 clear + emit 처리. 로컬 fallback.
            log::info!("fetch_workday: 세션 만료 — 로컬 캐시 fallback");
            return Ok(load_workday_cache(&app, &date)?.unwrap_or_else(|| empty_cache(&date)));
        }
        Err(e) => {
            log::warn!("fetch_workday: 서버 조회 실패 ({date}) — 로컬 캐시 사용: {e}");
            return Ok(load_workday_cache(&app, &date)?.unwrap_or_else(|| empty_cache(&date)));
        }
    };

    let server_cache = response_to_cache(response);
    let local_cache = load_workday_cache(&app, &date)?;

    if let Some(local) = &local_cache {
        if local.is_dirty {
            log::info!("fetch_workday: 로컬 dirty ({date}) — 서버 응답 무시");
            return Ok(local.clone());
        }
    }

    let changed = local_cache.as_ref() != Some(&server_cache);
    if changed {
        save_workday_cache(&app, &server_cache)?;
        let _ = app.emit("workday-changed", &date);
        salary::notify_settings_changed();
    }

    Ok(server_cache)
}

/// 오늘 일정 override 제거.
/// 설정의 기본 출퇴근 시간이 바뀌면 workday 캐시에 남은 임시 clockIn/Out이
/// 기본값 적용을 막을 수 있으므로 명시적으로 비운다.
#[tauri::command]
#[specta::specta]
pub async fn clear_workday_schedule_override(
    app: AppHandle,
    date: String,
) -> Result<Option<WorkdayCache>, String> {
    let Some(mut cache) = load_workday_cache(&app, &date)? else {
        return Ok(None);
    };

    if cache.clock_in_time.is_none() && cache.clock_out_time.is_none() {
        return Ok(Some(cache));
    }

    cache.clock_in_time = None;
    cache.clock_out_time = None;
    cache.is_dirty = true;
    save_workday_cache(&app, &cache)?;
    salary::notify_settings_changed();
    let _ = app.emit("workday-changed", &date);

    sync_dirty_workday_cache(&app, &date, &mut cache).await?;

    Ok(Some(cache))
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
    sync_dirty_workday_cache(&app, &date, &mut cache).await?;

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
        let c = response_to_cache(response(
            WorkdayType::Work,
            WorkdayStatus::Completed,
            vec![],
        ));
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
