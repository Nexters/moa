//! 사용자 설정 관리 커맨드

use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::types::{validate_pay_day, validate_salary_amount, UserSettings};

/// 사용자 설정 파일 경로
fn get_user_settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리 접근 실패: {e}"))?;

    std::fs::create_dir_all(&app_data_dir).map_err(|e| format!("디렉토리 생성 실패: {e}"))?;

    Ok(app_data_dir.join("user-settings.json"))
}

/// 사용자 설정 불러오기
#[tauri::command]
#[specta::specta]
pub async fn load_user_settings(app: AppHandle) -> Result<UserSettings, String> {
    let path = get_user_settings_path(&app)?;

    if !path.exists() {
        log::info!("사용자 설정 파일 없음, 기본값 반환");
        return Ok(UserSettings::default());
    }

    let contents =
        std::fs::read_to_string(&path).map_err(|e| format!("설정 파일 읽기 실패: {e}"))?;

    let settings: UserSettings =
        serde_json::from_str(&contents).map_err(|e| format!("설정 파싱 실패: {e}"))?;

    log::info!("사용자 설정 로드 완료");
    Ok(settings)
}

/// 사용자 설정 저장
#[tauri::command]
#[specta::specta]
pub async fn save_user_settings(app: AppHandle, settings: UserSettings) -> Result<(), String> {
    // Validation
    validate_salary_amount(settings.salary_amount)?;
    validate_pay_day(settings.pay_day)?;

    let path = get_user_settings_path(&app)?;

    let json = serde_json::to_string_pretty(&settings).map_err(|e| format!("직렬화 실패: {e}"))?;

    // Atomic write
    let temp_path = path.with_extension("tmp");
    std::fs::write(&temp_path, &json).map_err(|e| format!("임시 파일 쓰기 실패: {e}"))?;

    std::fs::rename(&temp_path, &path).map_err(|e| format!("파일 저장 실패: {e}"))?;

    log::info!("사용자 설정 저장 완료");
    Ok(())
}

/// 온보딩 완료 여부 확인
#[tauri::command]
#[specta::specta]
pub async fn is_onboarding_completed(app: AppHandle) -> Result<bool, String> {
    let settings = load_user_settings(app).await?;
    Ok(settings.onboarding_completed)
}

/// 모든 사용자 데이터 초기화
#[tauri::command]
#[specta::specta]
pub async fn reset_all_data(app: AppHandle) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리 접근 실패: {e}"))?;

    let files_to_delete = ["user-settings.json", "preferences.json"];

    for filename in files_to_delete {
        let file_path = app_data_dir.join(filename);
        if file_path.exists() {
            std::fs::remove_file(&file_path).map_err(|e| format!("{filename} 삭제 실패: {e}"))?;
        }
    }

    log::info!("모든 사용자 데이터 초기화 완료");
    Ok(())
}
