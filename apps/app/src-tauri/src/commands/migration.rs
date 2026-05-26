//! 구 recovery 파일 → 새 `WorkdayCache` 단일 파일로 1회 변환.
//!
//! See: `apps/app/docs/patterns/server-sync.md` (Migration 섹션)
//!
//! 호출 시점: `lib.rs::setup` 안에서 인증 복원 전.
//! 멱등: 구 파일이 없으면 no-op.

use std::path::{Path, PathBuf};

use serde::Deserialize;
use tauri::{AppHandle, Manager};

use crate::commands::workday::save_workday_cache;
use crate::types::{WorkdayCache, WorkdayKind};

#[derive(Debug, Clone, Copy, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
enum LegacyTodayWorkStatus {
    AnnualLeave,
    DayOff,
    PublicHoliday,
}

#[derive(Debug, Clone, Deserialize)]
struct LegacyTodayWorkStatusState {
    date: String,
    status: LegacyTodayWorkStatus,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyTodayWorkSchedule {
    date: String,
    work_start_time: String,
    work_end_time: String,
}

#[derive(Debug, Clone, Deserialize)]
struct LegacyVacationState {
    date: String,
}

fn recovery_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir 조회 실패: {e}"))?;
    Ok(app_data_dir.join("recovery"))
}

fn read_json<T: for<'de> serde::Deserialize<'de>>(path: &Path) -> Option<T> {
    if !path.exists() {
        return None;
    }
    let contents = std::fs::read_to_string(path).ok()?;
    serde_json::from_str::<T>(&contents).ok()
}

/// 순수 변환 함수 — I/O 분리. 단위 테스트 용이.
fn build_cache_from_legacy(
    status: Option<LegacyTodayWorkStatusState>,
    schedule: Option<LegacyTodayWorkSchedule>,
    vacation: Option<LegacyVacationState>,
) -> Option<WorkdayCache> {
    // 날짜 결정 + kind 추정 (status > vacation > schedule)
    let (date, kind_from_status) = if let Some(s) = status {
        let kind = match s.status {
            LegacyTodayWorkStatus::AnnualLeave => WorkdayKind::AnnualLeave,
            LegacyTodayWorkStatus::DayOff => WorkdayKind::DayOff,
            LegacyTodayWorkStatus::PublicHoliday => WorkdayKind::PublicHoliday,
        };
        (s.date, Some(kind))
    } else if let Some(v) = vacation {
        (v.date, Some(WorkdayKind::AnnualLeave))
    } else if let Some(ref s) = schedule {
        (s.date.clone(), None)
    } else {
        return None;
    };

    // schedule이 같은 날짜면 시간 채택
    let (clock_in_time, clock_out_time) = schedule
        .filter(|s| s.date == date)
        .map(|s| (Some(s.work_start_time), Some(s.work_end_time)))
        .unwrap_or((None, None));

    Some(WorkdayCache {
        date,
        kind: kind_from_status.unwrap_or(WorkdayKind::Work),
        clock_in_time,
        clock_out_time,
        completed: false,
        events: vec![],
        is_dirty: true, // 다음 폴링이 PUT으로 서버에 반영
    })
}

/// 구 recovery 파일 → `workday/{date}.json` 1회 변환.
/// 멱등 — 구 파일이 없으면 no-op.
pub fn migrate_legacy_workday_files(app: &AppHandle) -> Result<(), String> {
    let dir = recovery_dir(app)?;
    let status_path = dir.join("today-work-status.json");
    let schedule_path = dir.join("today-work-schedule.json");
    let vacation_path = dir.join("vacation-state.json");

    let any_exists = status_path.exists() || schedule_path.exists() || vacation_path.exists();
    if !any_exists {
        return Ok(());
    }

    let status: Option<LegacyTodayWorkStatusState> = read_json(&status_path);
    let schedule: Option<LegacyTodayWorkSchedule> = read_json(&schedule_path);
    let vacation: Option<LegacyVacationState> = read_json(&vacation_path);

    match build_cache_from_legacy(status, schedule, vacation) {
        Some(cache) => {
            save_workday_cache(app, &cache)?;
            log::info!(
                "workday cache 마이그레이션 완료: date={}, kind={:?}",
                cache.date,
                cache.kind
            );
        }
        None => {
            log::warn!("migrate: 구 파일 파싱 실패 — 변환 없이 정리");
        }
    }

    // 구 파일 삭제 (실패해도 진행 — 다음 부팅에서 재시도)
    let _ = std::fs::remove_file(&status_path);
    let _ = std::fs::remove_file(&schedule_path);
    let _ = std::fs::remove_file(&vacation_path);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn status(date: &str, s: LegacyTodayWorkStatus) -> LegacyTodayWorkStatusState {
        LegacyTodayWorkStatusState {
            date: date.into(),
            status: s,
        }
    }

    fn schedule(date: &str) -> LegacyTodayWorkSchedule {
        LegacyTodayWorkSchedule {
            date: date.into(),
            work_start_time: "09:00".into(),
            work_end_time: "18:00".into(),
        }
    }

    fn vacation(date: &str) -> LegacyVacationState {
        LegacyVacationState { date: date.into() }
    }

    #[test]
    fn status_only_yields_kind_from_status() {
        let cache = build_cache_from_legacy(
            Some(status("2026-05-25", LegacyTodayWorkStatus::DayOff)),
            None,
            None,
        )
        .unwrap();
        assert_eq!(cache.date, "2026-05-25");
        assert_eq!(cache.kind, WorkdayKind::DayOff);
        assert!(cache.is_dirty);
        assert!(cache.clock_in_time.is_none());
    }

    #[test]
    fn schedule_with_matching_date_provides_times() {
        let cache = build_cache_from_legacy(
            Some(status("2026-05-25", LegacyTodayWorkStatus::AnnualLeave)),
            Some(schedule("2026-05-25")),
            None,
        )
        .unwrap();
        assert_eq!(cache.kind, WorkdayKind::AnnualLeave);
        assert_eq!(cache.clock_in_time.as_deref(), Some("09:00"));
        assert_eq!(cache.clock_out_time.as_deref(), Some("18:00"));
    }

    #[test]
    fn schedule_with_mismatched_date_is_ignored() {
        let cache = build_cache_from_legacy(
            Some(status("2026-05-25", LegacyTodayWorkStatus::DayOff)),
            Some(schedule("2026-05-24")),
            None,
        )
        .unwrap();
        assert_eq!(cache.date, "2026-05-25");
        assert_eq!(cache.kind, WorkdayKind::DayOff);
        assert!(cache.clock_in_time.is_none());
        assert!(cache.clock_out_time.is_none());
    }

    #[test]
    fn schedule_only_falls_back_to_work_kind() {
        let cache = build_cache_from_legacy(None, Some(schedule("2026-05-25")), None).unwrap();
        assert_eq!(cache.kind, WorkdayKind::Work);
        assert_eq!(cache.clock_in_time.as_deref(), Some("09:00"));
    }

    #[test]
    fn vacation_only_falls_back_to_annual_leave() {
        let cache = build_cache_from_legacy(None, None, Some(vacation("2026-05-25"))).unwrap();
        assert_eq!(cache.kind, WorkdayKind::AnnualLeave);
        assert_eq!(cache.date, "2026-05-25");
    }

    #[test]
    fn status_takes_priority_over_vacation() {
        let cache = build_cache_from_legacy(
            Some(status("2026-05-25", LegacyTodayWorkStatus::DayOff)),
            None,
            Some(vacation("2026-05-25")),
        )
        .unwrap();
        // vacation은 annual-leave를 의미하지만 status가 day-off이므로 day-off 우선
        assert_eq!(cache.kind, WorkdayKind::DayOff);
    }

    #[test]
    fn returns_none_when_all_legacy_missing() {
        assert!(build_cache_from_legacy(None, None, None).is_none());
    }

    #[test]
    fn legacy_status_deserializes_kebab_case() {
        let json = r#"{"date":"2026-05-25","status":"annual-leave"}"#;
        let s: LegacyTodayWorkStatusState = serde_json::from_str(json).unwrap();
        assert!(matches!(s.status, LegacyTodayWorkStatus::AnnualLeave));
    }

    #[test]
    fn legacy_schedule_deserializes_camel_case() {
        let json = r#"{"date":"2026-05-25","workStartTime":"09:00","workEndTime":"18:00"}"#;
        let s: LegacyTodayWorkSchedule = serde_json::from_str(json).unwrap();
        assert_eq!(s.work_start_time, "09:00");
    }
}
