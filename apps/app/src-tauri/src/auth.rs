//! 인증 상태 및 토큰 저장 관리.

use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// 인증 상태 (메모리)
#[derive(Debug, Clone)]
pub struct AuthState {
    pub access_token: String,
}

/// 앱 전역 인증 저장소 — `app.manage()`로 등록
pub struct AuthStore(pub Mutex<Option<AuthState>>);

/// 디스크에 저장되는 인증 토큰 구조
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AuthFile {
    access_token: String,
}

fn auth_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리 접근 실패: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("디렉토리 생성 실패: {e}"))?;
    Ok(dir.join("auth.json"))
}

/// 디스크에서 토큰 로드
pub fn load_auth_token(app: &AppHandle) -> Option<AuthState> {
    let path = auth_file_path(app).ok()?;
    let contents = std::fs::read_to_string(&path).ok()?;
    let file: AuthFile = serde_json::from_str(&contents).ok()?;
    if file.access_token.is_empty() {
        return None;
    }
    Some(AuthState {
        access_token: file.access_token,
    })
}

/// 토큰을 디스크에 저장 + AuthStore 업데이트
pub fn save_auth_token(app: &AppHandle, access_token: &str) -> Result<(), String> {
    let path = auth_file_path(app)?;
    let file = AuthFile {
        access_token: access_token.to_string(),
    };
    let json = serde_json::to_string_pretty(&file).map_err(|e| format!("직렬화 실패: {e}"))?;

    let temp_path = path.with_extension("tmp");
    std::fs::write(&temp_path, &json).map_err(|e| format!("임시 파일 쓰기 실패: {e}"))?;
    std::fs::rename(&temp_path, &path).map_err(|e| format!("파일 저장 실패: {e}"))?;

    let store = app.state::<AuthStore>();
    *store.0.lock().unwrap() = Some(AuthState {
        access_token: access_token.to_string(),
    });

    log::info!("인증 토큰 저장 완료");
    Ok(())
}

/// 토큰 삭제 (디스크 + 메모리)
pub fn clear_auth_token(app: &AppHandle) {
    let store = app.state::<AuthStore>();
    *store.0.lock().unwrap() = None;

    if let Ok(path) = auth_file_path(app) {
        let _ = std::fs::remove_file(path);
    }
    log::info!("인증 토큰 삭제 완료");
}

/// 현재 access token 가져오기 (None이면 비로그인)
pub fn get_access_token(app: &AppHandle) -> Option<String> {
    let store = app.state::<AuthStore>();
    let guard = store.0.lock().unwrap();
    guard.as_ref().map(|s| s.access_token.clone())
}
