//! Salary calculation and menubar ticker.
//!
//! Runs a background thread that calculates salary every second
//! and updates the tray title directly, independent of the webview.
//!
//! Supports overnight shifts (e.g. 18:00–00:00, 22:00–06:00) by
//! normalising end/current minutes past midnight when end ≤ start.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use chrono::{Datelike, Local, NaiveDate, Timelike};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Emitter, Manager};

use crate::tray;
use crate::types::{MenubarDisplayMode, SalaryType, UserSettings};

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Type, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum WorkStatus {
    BeforeWork,
    Working,
    Completed,
    DayOff,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SalaryTickPayload {
    pub daily_rate: f64,
    pub hourly_rate: f64,
    pub per_second: f64,
    pub accumulated_earnings: f64,
    pub today_earnings: f64,
    pub work_status: WorkStatus,
    pub is_work_day: bool,
    pub worked_days: u32,
}

/// Vacation state stored in recovery/vacation-state.json
#[derive(Deserialize)]
struct VacationState {
    date: String,
}

/// Today work schedule stored in recovery/today-work-schedule.json
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TodayWorkSchedule {
    date: String,
    work_start_time: String,
    work_end_time: String,
}

// ============================================================================
// Settings changed signal
// ============================================================================

static SETTINGS_CHANGED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
#[specta::specta]
pub fn notify_settings_changed() {
    SETTINGS_CHANGED.store(true, Ordering::Relaxed);
    log::debug!("설정 변경 알림 수신");
}

// ============================================================================
// Ticker
// ============================================================================

pub fn start_salary_ticker(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let mut settings: Option<UserSettings> = load_settings(&app_handle);
        let mut prev_title: Option<String> = None;
        let mut prev_is_working: Option<bool> = None;

        loop {
            // Re-read settings on change
            if SETTINGS_CHANGED.swap(false, Ordering::Relaxed) {
                settings = load_settings(&app_handle);
            }

            let Some(ref s) = settings else {
                std::thread::sleep(Duration::from_secs(1));
                continue;
            };

            if !s.onboarding_completed {
                std::thread::sleep(Duration::from_secs(1));
                continue;
            }

            let recovery_dir = get_recovery_dir(&app_handle);
            let now = Local::now();
            let today_str = now.format("%Y-%m-%d").to_string();

            let is_on_vacation =
                load_vacation_state(&recovery_dir).is_some_and(|date| date == today_str);

            let today_override =
                load_today_schedule(&recovery_dir).and_then(|(date, start, end)| {
                    if date == today_str {
                        Some((start, end))
                    } else {
                        None
                    }
                });

            let Some(payload) = calculate_salary(
                s,
                is_on_vacation,
                today_override
                    .as_ref()
                    .map(|(s, e)| (s.as_str(), e.as_str())),
                now.naive_local(),
            ) else {
                std::thread::sleep(Duration::from_secs(1));
                continue;
            };

            // Update tray title
            let new_title = match s.menubar_display_mode {
                MenubarDisplayMode::None => None,
                MenubarDisplayMode::Daily => {
                    if payload.work_status == WorkStatus::DayOff {
                        None
                    } else {
                        Some(format_tray_title(payload.today_earnings))
                    }
                }
                MenubarDisplayMode::Accumulated => {
                    if payload.work_status == WorkStatus::DayOff {
                        None
                    } else {
                        Some(format_tray_title(payload.accumulated_earnings))
                    }
                }
            };

            if new_title != prev_title {
                #[cfg(target_os = "macos")]
                if let Some(tray_icon) = app_handle.tray_by_id("tray") {
                    let _ = tray_icon.set_title(new_title.as_deref());
                }
                prev_title = new_title;
            }

            // Update tray icon state
            let is_working = payload.work_status == WorkStatus::Working;
            if prev_is_working != Some(is_working) {
                tray::update_icon_state(&app_handle, is_working);
                prev_is_working = Some(is_working);
            }

            // Emit event to frontend
            let _ = app_handle.emit("salary-tick", &payload);

            std::thread::sleep(Duration::from_secs(1));
        }
    });

    log::info!("급여 타이머 시작");
}

// ============================================================================
// Salary calculation (1:1 port of use-salary-calculator.ts)
// ============================================================================

fn calculate_salary(
    settings: &UserSettings,
    is_on_vacation: bool,
    today_override: Option<(&str, &str)>,
    now: chrono::NaiveDateTime,
) -> Option<SalaryTickPayload> {
    let work_days = &settings.work_days;
    let work_start_time = today_override
        .map(|(s, _)| s)
        .unwrap_or(&settings.work_start_time);
    let work_end_time = today_override
        .map(|(_, e)| e)
        .unwrap_or(&settings.work_end_time);

    let work_start_minutes = time_to_minutes(work_start_time);
    let raw_end_minutes = time_to_minutes(work_end_time);

    // Overnight shift: treat end as next day when end <= start (e.g. 18:00–00:00)
    let work_end_minutes = if raw_end_minutes <= work_start_minutes {
        raw_end_minutes + 24 * 60
    } else {
        raw_end_minutes
    };

    let work_hours_per_day = (work_end_minutes as f64 - work_start_minutes as f64) / 60.0;

    if work_hours_per_day <= 0.0 {
        return None;
    }

    let monthly_salary = match settings.salary_type {
        SalaryType::Yearly => settings.salary_amount as f64 / 12.0,
        SalaryType::Monthly => settings.salary_amount as f64,
    };

    let today = now.date();
    let (period_start, period_end) = get_pay_period(today, settings.pay_day);
    let work_days_in_period = get_work_days_in_period(period_start, period_end, work_days);

    if work_days_in_period == 0 {
        return None;
    }

    let daily_rate = monthly_salary / work_days_in_period as f64;
    let hourly_rate = daily_rate / work_hours_per_day;
    let per_second = hourly_rate / 3600.0;

    let raw_current_minutes = now.time().hour() * 60 + now.time().minute();
    let is_overnight = raw_end_minutes <= work_start_minutes;

    // Overnight shift: when in the post-midnight working window (before shift ends),
    // attribute the shift to the previous calendar day for work-day determination.
    let effective_day =
        if is_overnight && raw_current_minutes < raw_end_minutes {
            today.pred_opt().unwrap_or(today)
        } else {
            today
        };

    // JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    let day_of_week = effective_day.weekday().num_days_from_sunday() as u8;
    let is_work_day = work_days.contains(&day_of_week) || today_override.is_some();

    // Overnight shift: normalise current time past midnight
    let current_minutes = if is_overnight && raw_current_minutes < work_start_minutes {
        raw_current_minutes + 24 * 60
    } else {
        raw_current_minutes
    };

    let (today_earnings, work_status) = if !is_work_day {
        (0.0, WorkStatus::DayOff)
    } else if is_on_vacation {
        (daily_rate, WorkStatus::DayOff)
    } else if current_minutes < work_start_minutes {
        (0.0, WorkStatus::BeforeWork)
    } else if current_minutes >= work_end_minutes {
        (daily_rate, WorkStatus::Completed)
    } else {
        let worked_minutes = current_minutes - work_start_minutes;
        let worked_seconds = worked_minutes * 60 + now.time().second();
        (per_second * worked_seconds as f64, WorkStatus::Working)
    };

    let worked_days = get_worked_days_since_pay_day(period_start, today, work_days);
    let accumulated_earnings = worked_days as f64 * daily_rate + today_earnings;

    Some(SalaryTickPayload {
        daily_rate,
        hourly_rate,
        per_second,
        accumulated_earnings,
        today_earnings,
        work_status,
        is_work_day,
        worked_days,
    })
}

// ============================================================================
// Helpers
// ============================================================================

/// Parse "HH:MM" to minutes since midnight.
fn time_to_minutes(time: &str) -> u32 {
    let parts: Vec<&str> = time.split(':').collect();
    if parts.len() != 2 {
        return 0;
    }
    let hours: u32 = parts[0].parse().unwrap_or(0);
    let minutes: u32 = parts[1].parse().unwrap_or(0);
    hours * 60 + minutes
}

/// Days in a given month (1-indexed month).
fn days_in_month(year: i32, month: u32) -> u32 {
    // Next month's 1st day, then go back 1 day
    if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)
    }
    .and_then(|d| d.pred_opt())
    .map(|d| d.day())
    .unwrap_or(30)
}

/// Get pay period (start inclusive, end exclusive) matching JS logic.
/// JS uses 0-indexed months; here we use 1-indexed (chrono convention).
fn get_pay_period(today: NaiveDate, pay_day: u8) -> (NaiveDate, NaiveDate) {
    let year = today.year();
    let month = today.month(); // 1-12
    let day = today.day();

    if day >= pay_day as u32 {
        // Current month's pay day to next month's pay day
        let start_day = std::cmp::min(pay_day as u32, days_in_month(year, month));
        let (end_year, end_month) = if month == 12 {
            (year + 1, 1)
        } else {
            (year, month + 1)
        };
        let end_day = std::cmp::min(pay_day as u32, days_in_month(end_year, end_month));

        let start = NaiveDate::from_ymd_opt(year, month, start_day).unwrap();
        let end = NaiveDate::from_ymd_opt(end_year, end_month, end_day).unwrap();
        (start, end)
    } else {
        // Previous month's pay day to this month's pay day
        let (start_year, start_month) = if month == 1 {
            (year - 1, 12)
        } else {
            (year, month - 1)
        };
        let start_day = std::cmp::min(pay_day as u32, days_in_month(start_year, start_month));
        let end_day = std::cmp::min(pay_day as u32, days_in_month(year, month));

        let start = NaiveDate::from_ymd_opt(start_year, start_month, start_day).unwrap();
        let end = NaiveDate::from_ymd_opt(year, month, end_day).unwrap();
        (start, end)
    }
}

/// Count work days in range [start, end).
fn get_work_days_in_period(start: NaiveDate, end: NaiveDate, work_days: &[u8]) -> u32 {
    let mut count = 0;
    let mut current = start;
    while current < end {
        let dow = current.weekday().num_days_from_sunday() as u8;
        if work_days.contains(&dow) {
            count += 1;
        }
        current = current.succ_opt().unwrap_or(current);
    }
    count
}

/// Count work days in [pay_day_start, today) — i.e., completed days before today.
fn get_worked_days_since_pay_day(
    pay_day_start: NaiveDate,
    today: NaiveDate,
    work_days: &[u8],
) -> u32 {
    let mut count = 0;
    let mut current = pay_day_start;
    while current < today {
        let dow = current.weekday().num_days_from_sunday() as u8;
        if work_days.contains(&dow) {
            count += 1;
        }
        current = current.succ_opt().unwrap_or(current);
    }
    count
}

/// Format amount as " 1,234,567원" (Korean currency with comma separators).
fn format_tray_title(amount: f64) -> String {
    let rounded = amount.floor() as i64;
    let s = format_with_commas(rounded.unsigned_abs());
    format!(" {s}원")
}

fn format_with_commas(n: u64) -> String {
    let s = n.to_string();
    let len = s.len();
    if len <= 3 {
        return s;
    }
    let mut result = String::with_capacity(len + len / 3);
    for (i, ch) in s.chars().enumerate() {
        if i > 0 && (len - i).is_multiple_of(3) {
            result.push(',');
        }
        result.push(ch);
    }
    result
}

// ============================================================================
// File I/O helpers
// ============================================================================

fn get_recovery_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .map(|d| d.join("recovery"))
        .unwrap_or_default()
}

fn load_settings(app: &AppHandle) -> Option<UserSettings> {
    let path = app.path().app_data_dir().ok()?.join("user-settings.json");

    let contents = std::fs::read_to_string(&path).ok()?;
    serde_json::from_str(&contents).ok()
}

fn load_vacation_state(recovery_dir: &Path) -> Option<String> {
    let path = recovery_dir.join("vacation-state.json");
    let contents = std::fs::read_to_string(path).ok()?;
    let state: VacationState = serde_json::from_str(&contents).ok()?;
    Some(state.date)
}

fn load_today_schedule(recovery_dir: &Path) -> Option<(String, String, String)> {
    let path = recovery_dir.join("today-work-schedule.json");
    let contents = std::fs::read_to_string(path).ok()?;
    let schedule: TodayWorkSchedule = serde_json::from_str(&contents).ok()?;
    Some((
        schedule.date,
        schedule.work_start_time,
        schedule.work_end_time,
    ))
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::MenubarDisplayMode;

    fn make_settings(salary_amount: u32, pay_day: u8) -> UserSettings {
        UserSettings {
            salary_type: SalaryType::Monthly,
            salary_amount,
            pay_day,
            work_days: vec![1, 2, 3, 4, 5], // Mon-Fri
            work_start_time: "09:00".to_string(),
            work_end_time: "18:00".to_string(),
            onboarding_completed: true,
            menubar_display_mode: MenubarDisplayMode::Daily,
        }
    }

    #[test]
    fn test_time_to_minutes() {
        assert_eq!(time_to_minutes("09:00"), 540);
        assert_eq!(time_to_minutes("18:00"), 1080);
        assert_eq!(time_to_minutes("00:00"), 0);
    }

    #[test]
    fn test_days_in_month() {
        assert_eq!(days_in_month(2025, 1), 31);
        assert_eq!(days_in_month(2025, 2), 28);
        assert_eq!(days_in_month(2024, 2), 29); // leap year
        assert_eq!(days_in_month(2025, 12), 31);
    }

    #[test]
    fn test_format_with_commas() {
        assert_eq!(format_with_commas(0), "0");
        assert_eq!(format_with_commas(999), "999");
        assert_eq!(format_with_commas(1000), "1,000");
        assert_eq!(format_with_commas(1234567), "1,234,567");
        assert_eq!(format_with_commas(100000000), "100,000,000");
    }

    #[test]
    fn test_format_tray_title() {
        assert_eq!(format_tray_title(1234567.89), " 1,234,567원");
        assert_eq!(format_tray_title(0.0), " 0원");
        assert_eq!(format_tray_title(999.5), " 999원");
    }

    #[test]
    fn test_calculate_salary_day_off() {
        let settings = make_settings(3_000_000, 25);
        // 2025-02-09 is Sunday (day off)
        let now = NaiveDate::from_ymd_opt(2025, 2, 9)
            .unwrap()
            .and_hms_opt(12, 0, 0)
            .unwrap();
        let result = calculate_salary(&settings, false, None, now).unwrap();
        assert_eq!(result.work_status, WorkStatus::DayOff);
        assert_eq!(result.today_earnings, 0.0);
    }

    #[test]
    fn test_calculate_salary_working() {
        let settings = make_settings(3_000_000, 25);
        // 2025-02-10 is Monday (work day), at 12:00
        let now = NaiveDate::from_ymd_opt(2025, 2, 10)
            .unwrap()
            .and_hms_opt(12, 0, 0)
            .unwrap();
        let result = calculate_salary(&settings, false, None, now).unwrap();
        assert_eq!(result.work_status, WorkStatus::Working);
        assert!(result.today_earnings > 0.0);
    }

    #[test]
    fn test_calculate_salary_vacation() {
        let settings = make_settings(3_000_000, 25);
        // Monday but on vacation
        let now = NaiveDate::from_ymd_opt(2025, 2, 10)
            .unwrap()
            .and_hms_opt(12, 0, 0)
            .unwrap();
        let result = calculate_salary(&settings, true, None, now).unwrap();
        assert_eq!(result.work_status, WorkStatus::DayOff);
    }

    #[test]
    fn test_pay_period_after_pay_day() {
        // Feb 26, pay day 25 → period: Feb 25 ~ Mar 25
        let today = NaiveDate::from_ymd_opt(2025, 2, 26).unwrap();
        let (start, end) = get_pay_period(today, 25);
        assert_eq!(start, NaiveDate::from_ymd_opt(2025, 2, 25).unwrap());
        assert_eq!(end, NaiveDate::from_ymd_opt(2025, 3, 25).unwrap());
    }

    #[test]
    fn test_pay_period_before_pay_day() {
        // Feb 10, pay day 25 → period: Jan 25 ~ Feb 25
        let today = NaiveDate::from_ymd_opt(2025, 2, 10).unwrap();
        let (start, end) = get_pay_period(today, 25);
        assert_eq!(start, NaiveDate::from_ymd_opt(2025, 1, 25).unwrap());
        assert_eq!(end, NaiveDate::from_ymd_opt(2025, 2, 25).unwrap());
    }

    #[test]
    fn test_pay_period_day_31_in_feb() {
        // Pay day 31, in February → clamp to 28
        let today = NaiveDate::from_ymd_opt(2025, 2, 10).unwrap();
        let (start, end) = get_pay_period(today, 31);
        assert_eq!(start, NaiveDate::from_ymd_opt(2025, 1, 31).unwrap());
        assert_eq!(end, NaiveDate::from_ymd_opt(2025, 2, 28).unwrap());
    }

    // -- Overnight shift tests --

    fn make_overnight_settings() -> UserSettings {
        UserSettings {
            salary_type: SalaryType::Monthly,
            salary_amount: 3_000_000,
            pay_day: 25,
            work_days: vec![1, 2, 3, 4, 5],
            work_start_time: "18:00".to_string(),
            work_end_time: "00:00".to_string(),
            onboarding_completed: true,
            menubar_display_mode: MenubarDisplayMode::Daily,
        }
    }

    #[test]
    fn test_overnight_working() {
        let settings = make_overnight_settings();
        // Monday 20:00 → Working
        let now = NaiveDate::from_ymd_opt(2025, 2, 10)
            .unwrap()
            .and_hms_opt(20, 0, 0)
            .unwrap();
        let result = calculate_salary(&settings, false, None, now).unwrap();
        assert_eq!(result.work_status, WorkStatus::Working);
        assert!(result.today_earnings > 0.0);
    }

    #[test]
    fn test_overnight_completed_before_start() {
        let settings = make_overnight_settings();
        // Monday 15:00 → Completed (shift ended at 00:00, before next shift at 18:00)
        let now = NaiveDate::from_ymd_opt(2025, 2, 10)
            .unwrap()
            .and_hms_opt(15, 0, 0)
            .unwrap();
        let result = calculate_salary(&settings, false, None, now).unwrap();
        assert_eq!(result.work_status, WorkStatus::Completed);
    }

    #[test]
    fn test_overnight_completed_after_midnight() {
        let settings = make_overnight_settings();
        // Tuesday 01:00 → Completed (shift ended at 00:00)
        let now = NaiveDate::from_ymd_opt(2025, 2, 11)
            .unwrap()
            .and_hms_opt(1, 0, 0)
            .unwrap();
        let result = calculate_salary(&settings, false, None, now).unwrap();
        assert_eq!(result.work_status, WorkStatus::Completed);
    }

    #[test]
    fn test_overnight_late_shift_working() {
        // 22:00–06:00 shift, at 02:00 → Working
        let settings = UserSettings {
            work_start_time: "22:00".to_string(),
            work_end_time: "06:00".to_string(),
            ..make_overnight_settings()
        };
        let now = NaiveDate::from_ymd_opt(2025, 2, 11)
            .unwrap()
            .and_hms_opt(2, 0, 0)
            .unwrap();
        let result = calculate_salary(&settings, false, None, now).unwrap();
        assert_eq!(result.work_status, WorkStatus::Working);
        assert!(result.today_earnings > 0.0);
    }

    #[test]
    fn test_overnight_cross_day_boundary() {
        // Friday 22:00–Saturday 06:00, at Saturday 02:00 → Working (not DayOff)
        // work_days = Mon-Fri, Saturday is NOT a work day, but the shift started on Friday
        let settings = UserSettings {
            work_start_time: "22:00".to_string(),
            work_end_time: "06:00".to_string(),
            ..make_overnight_settings()
        };
        // 2025-02-15 is Saturday, prev day (Friday) is a work day
        let now = NaiveDate::from_ymd_opt(2025, 2, 15)
            .unwrap()
            .and_hms_opt(2, 0, 0)
            .unwrap();
        let result = calculate_salary(&settings, false, None, now).unwrap();
        assert_eq!(result.work_status, WorkStatus::Working);
        assert!(result.today_earnings > 0.0);
    }
}
