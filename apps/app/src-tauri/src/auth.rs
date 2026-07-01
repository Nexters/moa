//! 인증 상태 및 토큰 저장 관리.

use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};

use crate::api_client::{ApiClient, ApiError};

/// refresh 서비스 식별자 (번들 identifier와 동일)
const KEYRING_SERVICE: &str = "com.moa.app";
const KEYRING_ACCOUNT: &str = "refresh_token";

/// 401 아닌 refresh 실패(네트워크/5xx) 후 재시도 쿨다운 (R3)
const REFRESH_FAILURE_COOLDOWN: Duration = Duration::from_secs(30);

/// 인증 상태 (메모리)
#[derive(Debug, Clone)]
pub struct AuthState {
    pub access_token: String,
    pub provider: String,
}

/// 앱 전역 인증 저장소 — `app.manage()`로 등록
pub struct AuthStore(pub Mutex<Option<AuthState>>);

/// 디스크에 저장되는 인증 토큰 구조
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AuthFile {
    access_token: String,
    #[serde(default)]
    provider: Option<String>,
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
///
/// provider가 없는 기존 auth.json은 강제 로그아웃 처리 (재로그인 유도)
pub fn load_auth_token(app: &AppHandle) -> Option<AuthState> {
    let path = auth_file_path(app).ok()?;
    let contents = std::fs::read_to_string(&path).ok()?;
    let file: AuthFile = serde_json::from_str(&contents).ok()?;
    if file.access_token.is_empty() {
        return None;
    }
    let provider = match file.provider {
        Some(p) if !p.is_empty() => p,
        _ => {
            log::info!("provider 없는 기존 토큰 — 강제 로그아웃");
            let _ = std::fs::remove_file(&path);
            return None;
        }
    };
    Some(AuthState {
        access_token: file.access_token,
        provider,
    })
}

/// 토큰을 디스크에 저장 + AuthStore 업데이트
pub fn save_auth_token(app: &AppHandle, access_token: &str, provider: &str) -> Result<(), String> {
    let path = auth_file_path(app)?;
    let file = AuthFile {
        access_token: access_token.to_string(),
        provider: Some(provider.to_string()),
    };
    let json = serde_json::to_string_pretty(&file).map_err(|e| format!("직렬화 실패: {e}"))?;

    let temp_path = path.with_extension("tmp");
    std::fs::write(&temp_path, &json).map_err(|e| format!("임시 파일 쓰기 실패: {e}"))?;
    std::fs::rename(&temp_path, &path).map_err(|e| format!("파일 저장 실패: {e}"))?;

    let store = app.state::<AuthStore>();
    *store.0.lock().unwrap() = Some(AuthState {
        access_token: access_token.to_string(),
        provider: provider.to_string(),
    });

    log::info!("인증 토큰 저장 완료 (provider: {})", provider);
    Ok(())
}

/// 토큰 삭제 (디스크 + 메모리 + keyring refresh)
///
/// refresh까지 통합 삭제하므로 모든 401/로그아웃 경로가 이 함수만 호출하면 된다 (R5).
pub fn clear_auth_token(app: &AppHandle) {
    let store = app.state::<AuthStore>();
    *store.0.lock().unwrap() = None;

    if let Ok(path) = auth_file_path(app) {
        let _ = std::fs::remove_file(path);
    }
    clear_refresh_token(app);
    log::info!("인증 토큰 삭제 완료");
}

/// 현재 access token 가져오기 (None이면 비로그인)
pub fn get_access_token(app: &AppHandle) -> Option<String> {
    let store = app.state::<AuthStore>();
    let guard = store.0.lock().unwrap();
    guard.as_ref().map(|s| s.access_token.clone())
}

// ============================================================================
// Refresh token — keyring 보안 저장 + single-flight 갱신
// ============================================================================

fn base_url() -> String {
    std::env::var("MOA_API_BASE_URL").unwrap_or_else(|_| "https://www.moa-official.kr".to_string())
}

/// debug 빌드 전용 평문 폴백 경로 (코드서명 안 된 dev 빌드에서 Keychain 팝업/거부 회피)
#[cfg(debug_assertions)]
fn refresh_fallback_path(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().app_data_dir().ok()?;
    std::fs::create_dir_all(&dir).ok()?;
    Some(dir.join("refresh.json"))
}

fn keyring_entry() -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
        .map_err(|e| format!("keyring 엔트리 생성 실패: {e}"))
}

/// refresh token 저장 + read-back 검증 (R1)
///
/// keyring 저장 성공을 낙관하지 않고 되읽어 확인한다. 회전제에서 저장 실패를
/// 성공으로 오인하면 다음 갱신 때 재사용 감지로 세션 전체가 무효화되기 때문.
pub fn save_refresh_token(app: &AppHandle, refresh: &str) -> Result<(), String> {
    match keyring_entry().and_then(|entry| {
        entry
            .set_password(refresh)
            .map_err(|e| format!("keyring 저장 실패: {e}"))?;
        // read-back 검증
        match entry.get_password() {
            Ok(v) if v == refresh => Ok(()),
            Ok(_) => Err("keyring read-back 불일치".to_string()),
            Err(e) => Err(format!("keyring read-back 실패: {e}")),
        }
    }) {
        Ok(()) => {
            log::info!("refresh token 저장 완료 (keyring)");
            Ok(())
        }
        Err(e) => {
            #[cfg(debug_assertions)]
            {
                log::warn!("keyring 저장 실패 — debug 파일 폴백 사용: {e}");
                if let Some(path) = refresh_fallback_path(app) {
                    return std::fs::write(&path, refresh)
                        .map_err(|e| format!("refresh 파일 폴백 저장 실패: {e}"));
                }
                Err("refresh 파일 폴백 경로 없음".to_string())
            }
            #[cfg(not(debug_assertions))]
            {
                let _ = app;
                Err(e)
            }
        }
    }
}

/// refresh token 로드 (없으면 None → 재로그인 신호, R4)
pub fn load_refresh_token(app: &AppHandle) -> Option<String> {
    match keyring_entry().and_then(|entry| {
        entry
            .get_password()
            .map_err(|e| format!("keyring 조회 실패: {e}"))
    }) {
        Ok(token) if !token.is_empty() => return Some(token),
        Ok(_) => return None,
        Err(_e) => {
            #[cfg(debug_assertions)]
            {
                if let Some(path) = refresh_fallback_path(app) {
                    if let Ok(token) = std::fs::read_to_string(&path) {
                        if !token.is_empty() {
                            return Some(token);
                        }
                    }
                }
            }
            #[cfg(not(debug_assertions))]
            let _ = app;
        }
    }
    None
}

/// refresh token 삭제 (멱등)
pub fn clear_refresh_token(app: &AppHandle) {
    if let Ok(entry) = keyring_entry() {
        // NoEntry 등은 무시 (멱등)
        let _ = entry.delete_credential();
    }
    #[cfg(debug_assertions)]
    if let Some(path) = refresh_fallback_path(app) {
        let _ = std::fs::remove_file(path);
    }
    #[cfg(not(debug_assertions))]
    let _ = app;
}

/// refresh 진행 상태 — single-flight 락이 보호 (R2, R3)
#[derive(Default)]
struct RefreshState {
    /// 401 아닌 실패(네트워크/5xx) 시각. 쿨다운 재진입 방지용.
    last_failure: Option<Instant>,
}

/// 직전 비-401 실패로부터 쿨다운이 아직 유효한지 (R3). true면 refresh 재시도 금지.
fn in_failure_cooldown(last_failure: Option<Instant>, now: Instant) -> bool {
    match last_failure {
        Some(at) => now.duration_since(at) < REFRESH_FAILURE_COOLDOWN,
        None => false,
    }
}

fn refresh_lock() -> &'static tauri::async_runtime::Mutex<RefreshState> {
    static LOCK: OnceLock<tauri::async_runtime::Mutex<RefreshState>> = OnceLock::new();
    LOCK.get_or_init(|| tauri::async_runtime::Mutex::new(RefreshState::default()))
}

/// access token 갱신 (single-flight).
///
/// `failed_token`은 401을 유발한 access token. 락 진입 후 현재 access가 이와 다르면
/// 이미 다른 요청이 갱신한 것이므로 새 access를 그대로 반환한다 (R2, 중복 회전 방지).
///
/// 최종 실패(refresh 무효/없음) 시 clear + `auth_expired` emit 후 Unauthorized 반환.
pub async fn refresh_access_token(app: &AppHandle, failed_token: &str) -> Result<String, ApiError> {
    let mut state = refresh_lock().lock().await;

    // R2: 락 대기 중 다른 요청이 이미 갱신했는지 확인
    if let Some(current) = get_access_token(app) {
        if current != failed_token {
            return Ok(current);
        }
    }

    // R3: 직전 비-401 실패가 쿨다운 이내면 재시도하지 않음
    if in_failure_cooldown(state.last_failure, Instant::now()) {
        return Err(ApiError::Network("refresh 쿨다운 중".to_string()));
    }

    // R4: refresh 자체가 없으면 즉시 재로그인 (실패 캐싱 대상 아님)
    let Some(refresh) = load_refresh_token(app) else {
        drop(state);
        finalize_expired(app);
        return Err(ApiError::Unauthorized);
    };

    let api = ApiClient::new(&base_url());
    match api.auth_refresh(&refresh).await {
        Ok(pair) => {
            let provider = current_provider(app).unwrap_or_default();
            // R1: refresh 우선 저장 + 검증 → 성공해야 access 저장
            if !pair.refresh_token.is_empty() {
                if let Err(e) = save_refresh_token(app, &pair.refresh_token) {
                    log::error!("새 refresh 저장 실패 — 세션 정합성 위해 재로그인: {e}");
                    state.last_failure = None;
                    drop(state);
                    finalize_expired(app);
                    return Err(ApiError::Unauthorized);
                }
            }
            if let Err(e) = save_auth_token(app, &pair.access_token, &provider) {
                log::error!("새 access 저장 실패: {e}");
                drop(state);
                finalize_expired(app);
                return Err(ApiError::Unauthorized);
            }
            state.last_failure = None;
            log::info!("access token 갱신 완료");
            Ok(pair.access_token)
        }
        Err(ApiError::Unauthorized) => {
            // refresh 무효 → 재로그인
            state.last_failure = None;
            drop(state);
            finalize_expired(app);
            Err(ApiError::Unauthorized)
        }
        Err(e) => {
            // 네트워크/5xx → 쿨다운 기록, 토큰은 유지(재시도 가능)
            log::warn!("refresh 일시 실패: {e}");
            state.last_failure = Some(Instant::now());
            Err(e)
        }
    }
}

/// 현재 provider 조회 (갱신 시 재저장용)
fn current_provider(app: &AppHandle) -> Option<String> {
    let store = app.state::<AuthStore>();
    let guard = store.0.lock().unwrap();
    guard.as_ref().map(|s| s.provider.clone())
}

/// 세션 만료 확정 — 토큰 전체 삭제 + 프론트에 재로그인 신호
pub fn finalize_expired(app: &AppHandle) {
    clear_auth_token(app);
    let _ = app.emit("auth_expired", ());
}

/// 토큰 자동 갱신 재시도 래퍼.
///
/// `f`는 access token을 받아 API를 호출하는 클로저(2회 호출 가능해야 함).
/// 401이면 single-flight refresh 1회 → 성공 시 새 토큰으로 1회만 재시도한다.
/// 재시도도 401이면 `refresh_access_token`이 이미 `finalize_expired`를 호출한 상태.
///
/// call site 패턴 (req 이동/소유 문제 회피 — 클로저 안에서 ApiClient 생성 + req clone):
/// ```ignore
/// with_token_retry(&app, |t| Box::pin(async move {
///     ApiClient::new(&base).get_payroll(&t).await
/// })).await
/// ```
pub async fn with_token_retry<T, F>(app: &AppHandle, f: F) -> Result<T, ApiError>
where
    F: Fn(
        String,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, ApiError>> + Send>>,
{
    let token = get_access_token(app).ok_or(ApiError::Unauthorized)?;

    match f(token.clone()).await {
        Err(ApiError::Unauthorized) => {
            // single-flight refresh (실패 시 refresh_access_token이 finalize 처리)
            let new_token = refresh_access_token(app, &token).await?;
            f(new_token).await
        }
        other => other,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api_client::TokenPair;

    #[test]
    fn cooldown_none_failure_allows_retry() {
        // 실패 이력 없으면 쿨다운 아님 (R3)
        assert!(!in_failure_cooldown(None, Instant::now()));
    }

    #[test]
    fn cooldown_recent_failure_blocks_retry() {
        // 방금 실패 → 쿨다운 (R3)
        let now = Instant::now();
        assert!(in_failure_cooldown(Some(now), now));
    }

    #[test]
    fn cooldown_expires_after_window() {
        // 쿨다운 창을 넘긴 과거 실패 → 재시도 허용 (R3)
        let past = Instant::now() - (REFRESH_FAILURE_COOLDOWN + Duration::from_secs(1));
        assert!(!in_failure_cooldown(Some(past), Instant::now()));
    }

    #[test]
    fn token_pair_defaults_refresh_when_absent() {
        // 과도기: 서버가 refreshToken을 안 주면 빈 문자열로 default (하위호환)
        let json = r#"{"accessToken":"a"}"#;
        let pair: TokenPair = serde_json::from_str(json).unwrap();
        assert_eq!(pair.access_token, "a");
        assert!(pair.refresh_token.is_empty());
    }

    #[test]
    fn token_pair_parses_both_tokens() {
        let json = r#"{"accessToken":"a","refreshToken":"r"}"#;
        let pair: TokenPair = serde_json::from_str(json).unwrap();
        assert_eq!(pair.access_token, "a");
        assert_eq!(pair.refresh_token, "r");
    }
}
