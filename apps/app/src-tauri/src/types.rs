//! Shared types and validation functions for the Tauri application.

use regex::Regex;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::LazyLock;

/// Maximum size for recovery data files (10MB)
pub const MAX_RECOVERY_DATA_BYTES: u32 = 10_485_760;

/// Pre-compiled regex pattern for filename validation.
/// Only allows alphanumeric characters, dashes, underscores, and a single extension.
pub static FILENAME_PATTERN: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9]+)?$")
        .expect("Failed to compile filename regex pattern")
});

// ============================================================================
// Preferences
// ============================================================================

/// Application preferences that persist to disk.
/// Only contains settings that should be saved between sessions.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppPreferences {
    pub theme: String,
    /// User's preferred language (e.g., "en", "es", "de")
    /// If None, uses system locale detection
    pub language: Option<String>,
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            language: None, // None means use system locale
        }
    }
}

// ============================================================================
// Recovery Errors
// ============================================================================

/// Error types for recovery operations (typed for frontend matching)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum RecoveryError {
    /// File does not exist (expected case, not a failure)
    FileNotFound,
    /// Filename validation failed
    ValidationError { message: String },
    /// Data exceeds size limit
    DataTooLarge { max_bytes: u32 },
    /// File system read/write error
    IoError { message: String },
    /// JSON serialization/deserialization error
    ParseError { message: String },
}

impl std::fmt::Display for RecoveryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RecoveryError::FileNotFound => write!(f, "File not found"),
            RecoveryError::ValidationError { message } => write!(f, "Validation error: {message}"),
            RecoveryError::DataTooLarge { max_bytes } => {
                write!(f, "Data too large (max {max_bytes} bytes)")
            }
            RecoveryError::IoError { message } => write!(f, "IO error: {message}"),
            RecoveryError::ParseError { message } => write!(f, "Parse error: {message}"),
        }
    }
}

// ============================================================================
// Validation Functions
// ============================================================================

/// Validates a filename for safe file system operations.
/// Only allows alphanumeric characters, dashes, underscores, and a single extension.
pub fn validate_filename(filename: &str) -> Result<(), String> {
    if filename.is_empty() {
        return Err("Filename cannot be empty".to_string());
    }

    if filename.chars().count() > 100 {
        return Err("Filename too long (max 100 characters)".to_string());
    }

    if !FILENAME_PATTERN.is_match(filename) {
        return Err(
            "Invalid filename: only alphanumeric characters, dashes, underscores, and dots allowed"
                .to_string(),
        );
    }

    Ok(())
}

/// Validates string input length (by character count, not bytes).
pub fn validate_string_input(input: &str, max_len: usize, field_name: &str) -> Result<(), String> {
    let char_count = input.chars().count();
    if char_count > max_len {
        return Err(format!("{field_name} too long (max {max_len} characters)"));
    }
    Ok(())
}

/// Validates theme value.
pub fn validate_theme(theme: &str) -> Result<(), String> {
    match theme {
        "light" | "dark" | "system" => Ok(()),
        _ => Err("Invalid theme: must be 'light', 'dark', or 'system'".to_string()),
    }
}

// ============================================================================
// User Settings (MVP)
// ============================================================================

/// Salary type for user settings
#[derive(Debug, Clone, Serialize, Deserialize, Type, Default, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SalaryType {
    #[default]
    Monthly,
    Yearly,
}

/// User settings for salary calculation (MVP)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    /// Salary type (monthly or yearly)
    #[serde(default)]
    pub salary_type: SalaryType,
    /// Salary amount in KRW (monthly net salary or yearly salary)
    pub salary_amount: u32,
    /// Pay day of month (1-31, default: 25)
    pub pay_day: u8,
    /// Work days (0=Sunday, 1=Monday, ..., 6=Saturday)
    #[serde(default = "default_work_days")]
    pub work_days: Vec<u8>,
    /// Work start time (HH:MM format, default: "09:00")
    #[serde(default = "default_work_start_time")]
    pub work_start_time: String,
    /// Work end time (HH:MM format, default: "18:00")
    #[serde(default = "default_work_end_time")]
    pub work_end_time: String,
    /// Lunch start time (HH:MM format, default: "12:00")
    #[serde(default = "default_lunch_start_time")]
    pub lunch_start_time: String,
    /// Lunch end time (HH:MM format, default: "13:00")
    #[serde(default = "default_lunch_end_time")]
    pub lunch_end_time: String,
    /// Whether onboarding is completed
    pub onboarding_completed: bool,
    /// Whether to show accumulated salary in menubar (macOS only)
    #[serde(default = "default_show_menubar_salary")]
    pub show_menubar_salary: bool,
}

fn default_show_menubar_salary() -> bool {
    true
}

fn default_work_days() -> Vec<u8> {
    vec![1, 2, 3, 4, 5] // Mon-Fri (1=Mon, 5=Fri)
}

fn default_work_start_time() -> String {
    "09:00".to_string()
}

fn default_work_end_time() -> String {
    "18:00".to_string()
}

fn default_lunch_start_time() -> String {
    "12:00".to_string()
}

fn default_lunch_end_time() -> String {
    "13:00".to_string()
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            salary_type: SalaryType::default(),
            salary_amount: 0,
            pay_day: 25,
            work_days: default_work_days(),
            work_start_time: default_work_start_time(),
            work_end_time: default_work_end_time(),
            lunch_start_time: default_lunch_start_time(),
            lunch_end_time: default_lunch_end_time(),
            onboarding_completed: false,
            show_menubar_salary: true,
        }
    }
}

/// Validates salary amount (monthly net salary or hourly wage)
pub fn validate_salary_amount(amount: u32) -> Result<(), String> {
    if amount == 0 {
        return Err("급여 금액은 0보다 커야 합니다".to_string());
    }
    Ok(())
}

/// Validates pay day (1-31)
pub fn validate_pay_day(day: u8) -> Result<(), String> {
    if !(1..=31).contains(&day) {
        return Err("월급날은 1~31 사이여야 합니다".to_string());
    }
    Ok(())
}
