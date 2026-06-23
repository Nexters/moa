//! Push notification token provider.
//!
//! Firebase registration tokens are treated as credentials: never log the
//! token value and keep this module as the only boundary that exposes it.

use std::sync::{Mutex, OnceLock};

static FCM_DEVICE_TOKEN_CACHE: OnceLock<Mutex<Option<String>>> = OnceLock::new();

pub async fn get_fcm_device_token() -> Result<String, String> {
    if let Some(token) = cached_fcm_device_token() {
        return Ok(token);
    }

    let token = platform::fetch_fcm_device_token().await?;
    if token.trim().is_empty() {
        return Err("FCM 토큰이 비어 있습니다".to_string());
    }

    cache_fcm_device_token(&token);
    Ok(token)
}

fn cached_fcm_device_token() -> Option<String> {
    FCM_DEVICE_TOKEN_CACHE
        .get_or_init(|| Mutex::new(None))
        .lock()
        .ok()
        .and_then(|guard| guard.clone())
}

fn cache_fcm_device_token(token: &str) {
    if let Ok(mut guard) = FCM_DEVICE_TOKEN_CACHE
        .get_or_init(|| Mutex::new(None))
        .lock()
    {
        *guard = Some(token.to_string());
    }
}

#[cfg(target_os = "macos")]
mod platform {
    pub async fn fetch_fcm_device_token() -> Result<String, String> {
        Err("macOS FCM 네이티브 브리지가 아직 설정되지 않아 토큰을 가져올 수 없습니다".to_string())
    }
}

#[cfg(not(target_os = "macos"))]
mod platform {
    pub async fn fetch_fcm_device_token() -> Result<String, String> {
        Err("현재 플랫폼은 FCM 토큰 발급을 지원하지 않습니다".to_string())
    }
}
