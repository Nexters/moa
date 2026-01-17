//! Shared types and validation functions for the Tauri application.

use regex::Regex;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::LazyLock;

/// Default shortcut for the quick pane
pub const DEFAULT_QUICK_PANE_SHORTCUT: &str = "CommandOrControl+Shift+.";

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
    /// Global shortcut for quick pane (e.g., "CommandOrControl+Shift+.")
    /// If None, uses the default shortcut
    pub quick_pane_shortcut: Option<String>,
    /// User's preferred language (e.g., "en", "es", "de")
    /// If None, uses system locale detection
    pub language: Option<String>,
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            quick_pane_shortcut: None, // None means use default
            language: None,            // None means use system locale
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

/// Work schedule constants (fixed for MVP)
/// Will be used in Task 3 (salary calculator)
#[allow(dead_code)]
pub const WORK_DAYS: [u8; 5] = [1, 2, 3, 4, 5]; // Mon-Fri (1=Mon, 7=Sun)
#[allow(dead_code)]
pub const WORK_START_TIME: &str = "09:00";
#[allow(dead_code)]
pub const WORK_END_TIME: &str = "18:00";
#[allow(dead_code)]
pub const WORK_HOURS_PER_DAY: u8 = 9;

/// User settings for salary calculation (MVP)
/// Will be used in Task 2 (user settings commands)
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UserSettings {
    /// Nickname (randomly generated)
    pub nickname: String,
    /// Company/workplace name (randomly generated)
    pub company_name: String,
    /// Monthly net salary in KRW
    pub monthly_net_salary: u64,
    /// Pay day of month (1-31, default: 25)
    pub pay_day: u8,
    /// Whether onboarding is completed
    pub onboarding_completed: bool,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            nickname: generate_random_nickname(),
            company_name: generate_random_company(),
            monthly_net_salary: 0,
            pay_day: 25,
            onboarding_completed: false,
        }
    }
}

/// Generates a random nickname combining an adjective and a character
#[allow(dead_code)]
pub fn generate_random_nickname() -> String {
    use rand::prelude::IndexedRandom;

    let adjectives = ["성실한", "부지런한", "열정적인", "꼼꼼한", "유능한", "프로"];
    let characters = ["뚱이", "징징이", "다람이", "핑핑이", "보노보노", "포차코"];

    let mut rng = rand::rng();
    let adj = adjectives.choose(&mut rng).unwrap_or(&"성실한");
    let char = characters.choose(&mut rng).unwrap_or(&"뚱이");

    format!("{adj} {char}")
}

/// Generates a random company name
#[allow(dead_code)]
pub fn generate_random_company() -> String {
    use rand::prelude::IndexedRandom;

    let companies = [
        "집게리아",
        "버거왕국",
        "초코파이공장",
        "별다방",
        "감자튀김연구소",
        "햄버거학교",
        "피자왕국",
        "치킨나라",
    ];

    let mut rng = rand::rng();
    companies
        .choose(&mut rng)
        .unwrap_or(&"집게리아")
        .to_string()
}

/// Validates monthly net salary
#[allow(dead_code)]
pub fn validate_salary(salary: u64) -> Result<(), String> {
    if salary == 0 {
        return Err("월 실수령액은 0보다 커야 합니다".to_string());
    }
    Ok(())
}

/// Validates pay day (1-31)
#[allow(dead_code)]
pub fn validate_pay_day(day: u8) -> Result<(), String> {
    if !(1..=31).contains(&day) {
        return Err("월급날은 1~31 사이여야 합니다".to_string());
    }
    Ok(())
}
