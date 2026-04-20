//! 소셜 로그인 및 서버 동기화 커맨드.

use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::atomic::{AtomicBool, Ordering};

use rand::distr::Alphanumeric;
use rand::Rng;
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Manager};

use crate::api_client::{
    ApiClient, ApiError, PaydayPatchRequest, PayrollPatchRequest, SalaryInputType, Weekday,
    WorkPolicyPatchRequest,
};
use crate::auth;
use crate::commands::user_settings::{get_user_settings_path, save_user_settings_sync};
use crate::salary;
use crate::types::{SalaryType, UserSettings};

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AuthStatus {
    pub is_logged_in: bool,
    pub provider: Option<AuthProvider>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LoginResult {
    pub is_logged_in: bool,
    pub needs_onboarding: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum AuthProvider {
    Kakao,
    Apple,
}

impl AuthProvider {
    fn as_str(&self) -> &'static str {
        match self {
            AuthProvider::Kakao => "kakao",
            AuthProvider::Apple => "apple",
        }
    }
}

// ============================================================================
// Kakao OAuth helpers
// ============================================================================

#[derive(Deserialize)]
struct KakaoTokenResponse {
    id_token: Option<String>,
}

/// 카카오 REST API로 auth code → id_token 교환
async fn exchange_kakao_code(code: &str, redirect_uri: &str) -> Result<String, String> {
    let client_id =
        std::env::var("KAKAO_REST_API_KEY").map_err(|_| "KAKAO_REST_API_KEY 환경변수 미설정")?;
    let client_secret =
        std::env::var("KAKAO_CLIENT_SECRET").map_err(|_| "KAKAO_CLIENT_SECRET 환경변수 미설정")?;

    let client = reqwest::Client::new();
    let resp = client
        .post("https://kauth.kakao.com/oauth/token")
        .form(&[
            ("grant_type", "authorization_code"),
            ("client_id", &client_id),
            ("client_secret", &client_secret),
            ("redirect_uri", redirect_uri),
            ("code", code),
        ])
        .send()
        .await
        .map_err(|e| format!("카카오 토큰 요청 실패: {e}"))?;

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("카카오 토큰 교환 실패: {text}"));
    }

    let token_resp: KakaoTokenResponse = resp
        .json()
        .await
        .map_err(|e| format!("카카오 토큰 파싱 실패: {e}"))?;

    token_resp
        .id_token
        .ok_or_else(|| "카카오 응답에 id_token 없음 (OIDC 활성화 확인 필요)".into())
}

// ============================================================================
// Apple OAuth helpers
// ============================================================================

#[derive(Deserialize)]
struct AppleTokenResponse {
    id_token: Option<String>,
}

/// Apple client_secret JWT 생성 (ES256)
///
/// SECURITY(TODO #issue-TBD): 현재 데스크톱 클라이언트에서 Apple private key를
/// 직접 읽어 서명하고 있어 RFC 8252 §8.5(퍼블릭 클라이언트 secret 보관 금지)에
/// 위배됩니다. 중기적으로 MOA 서버에 `auth code → id_token 교환` 엔드포인트를
/// 추가하고, 클라이언트는 `auth code`만 전달하는 구조로 이전해야 합니다.
fn generate_apple_client_secret() -> Result<String, String> {
    let team_id = std::env::var("APPLE_TEAM_ID").map_err(|_| "APPLE_TEAM_ID 미설정")?;
    let client_id = std::env::var("APPLE_CLIENT_ID").map_err(|_| "APPLE_CLIENT_ID 미설정")?;
    let key_id = std::env::var("APPLE_KEY_ID").map_err(|_| "APPLE_KEY_ID 미설정")?;
    let private_key = std::env::var("APPLE_PRIVATE_KEY").map_err(|_| "APPLE_PRIVATE_KEY 미설정")?;

    let now = chrono::Utc::now().timestamp() as u64;
    let claims = serde_json::json!({
        "iss": team_id,
        "iat": now,
        "exp": now + 15777000, // ~6개월
        "aud": "https://appleid.apple.com",
        "sub": client_id,
    });

    let header = jsonwebtoken::Header {
        alg: jsonwebtoken::Algorithm::ES256,
        kid: Some(key_id),
        ..Default::default()
    };

    let key = jsonwebtoken::EncodingKey::from_ec_pem(private_key.as_bytes())
        .map_err(|e| format!("Apple 프라이빗 키 파싱 실패: {e}"))?;

    jsonwebtoken::encode(&header, &claims, &key)
        .map_err(|e| format!("Apple client_secret JWT 생성 실패: {e}"))
}

/// Apple auth code → id_token 교환
async fn exchange_apple_code(code: &str, redirect_uri: &str) -> Result<String, String> {
    let client_id =
        std::env::var("APPLE_CLIENT_ID").map_err(|_| "APPLE_CLIENT_ID 환경변수 미설정")?;
    let client_secret = generate_apple_client_secret()?;

    let client = reqwest::Client::new();
    let resp = client
        .post("https://appleid.apple.com/auth/token")
        .form(&[
            ("grant_type", "authorization_code"),
            ("client_id", &client_id),
            ("client_secret", &client_secret),
            ("redirect_uri", redirect_uri),
            ("code", code),
        ])
        .send()
        .await
        .map_err(|e| format!("Apple 토큰 요청 실패: {e}"))?;

    if !resp.status().is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Apple 토큰 교환 실패: {text}"));
    }

    let token_resp: AppleTokenResponse = resp
        .json()
        .await
        .map_err(|e| format!("Apple 토큰 파싱 실패: {e}"))?;

    token_resp
        .id_token
        .ok_or_else(|| "Apple 응답에 id_token 없음".into())
}

// ============================================================================
// Localhost OAuth callback server
// ============================================================================

/// 진행 중인 소셜 로그인 취소 플래그
static SOCIAL_LOGIN_CANCELLED: AtomicBool = AtomicBool::new(false);

/// OAuth callback용 고정 포트 (카카오/애플 콘솔에 등록 필요)
const OAUTH_CALLBACK_PORT: u16 = 17171;

/// localhost에서 OAuth callback을 수신하는 임시 서버
fn start_oauth_callback_server() -> Result<(TcpListener, String), String> {
    let listener = TcpListener::bind(format!("127.0.0.1:{OAUTH_CALLBACK_PORT}"))
        .map_err(|e| format!("로컬 서버 바인드 실패 (포트 {OAUTH_CALLBACK_PORT}): {e}"))?;
    let redirect_uri = format!("http://127.0.0.1:{OAUTH_CALLBACK_PORT}/callback");
    Ok((listener, redirect_uri))
}

/// OAuth state 파라미터용 난수 생성 (RFC 6749 §10.12 CSRF 방어)
fn generate_oauth_state() -> String {
    rand::rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect()
}

/// callback에서 auth code 추출 + state 검증 (2분 타임아웃)
fn wait_for_auth_code(listener: &TcpListener, expected_state: &str) -> Result<String, String> {
    listener
        .set_nonblocking(true)
        .map_err(|e| format!("소켓 설정 실패: {e}"))?;

    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(120);
    let (mut stream, _) = loop {
        match listener.accept() {
            Ok(conn) => break conn,
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                if SOCIAL_LOGIN_CANCELLED.load(Ordering::Relaxed) {
                    return Err("소셜 로그인이 취소되었습니다".to_string());
                }
                if std::time::Instant::now() >= deadline {
                    return Err("OAuth 콜백 타임아웃 (2분 초과)".to_string());
                }
                std::thread::sleep(std::time::Duration::from_millis(100));
            }
            Err(e) => return Err(format!("연결 수신 실패: {e}")),
        }
    };

    let mut buf = [0u8; 4096];
    let n = stream
        .read(&mut buf)
        .map_err(|e| format!("요청 읽기 실패: {e}"))?;
    let request = String::from_utf8_lossy(&buf[..n]);

    // GET /callback?code=xxx&state=yyy HTTP/1.1
    let code = extract_query_param(&request, "code")
        .ok_or_else(|| "callback에서 auth code를 찾을 수 없습니다".to_string())?;
    let state = extract_query_param(&request, "state")
        .ok_or_else(|| "callback에 state 파라미터 없음 — CSRF 의심".to_string())?;
    if state != expected_state {
        return Err("state 검증 실패 — CSRF 의심".to_string());
    }

    // HTML 응답
    let body = r#"<!DOCTYPE html><html><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,sans-serif"><div style="text-align:center;padding:40px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08)"><div style="font-size:48px;margin-bottom:16px">&#10003;</div><h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a">로그인 완료</h2><p style="margin:0;color:#666;font-size:14px">Moa 앱으로 돌아가세요</p></div></body></html>"#;
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        body.len(),
        body
    );
    let _ = stream.write_all(response.as_bytes());

    Ok(code)
}

fn extract_query_param(request: &str, key: &str) -> Option<String> {
    let first_line = request.lines().next()?;
    let path = first_line.split_whitespace().nth(1)?;
    let query = path.split('?').nth(1)?;

    let params: HashMap<&str, &str> = query
        .split('&')
        .filter_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            Some((parts.next()?, parts.next()?))
        })
        .collect();

    params.get(key).map(|v| v.to_string())
}

// ============================================================================
// Commands
// ============================================================================

/// 소셜 로그인 (카카오/애플)
#[tauri::command]
#[specta::specta]
pub async fn social_login(app: AppHandle, provider: AuthProvider) -> Result<LoginResult, String> {
    SOCIAL_LOGIN_CANCELLED.store(false, Ordering::Relaxed);
    let (listener, redirect_uri) = start_oauth_callback_server()?;
    let state = generate_oauth_state();

    // provider별 authorize URL 생성
    let authorize_url = match &provider {
        AuthProvider::Kakao => {
            let client_id = std::env::var("KAKAO_REST_API_KEY")
                .map_err(|_| "KAKAO_REST_API_KEY 환경변수 미설정")?;
            format!(
                "https://kauth.kakao.com/oauth/authorize?client_id={}&redirect_uri={}&response_type=code&scope=openid&state={}",
                client_id,
                urlencoded(&redirect_uri),
                state,
            )
        }
        AuthProvider::Apple => {
            let client_id =
                std::env::var("APPLE_CLIENT_ID").map_err(|_| "APPLE_CLIENT_ID 환경변수 미설정")?;
            format!(
                "https://appleid.apple.com/auth/authorize?client_id={}&redirect_uri={}&response_type=code&scope=openid&response_mode=query&state={}",
                client_id,
                urlencoded(&redirect_uri),
                state,
            )
        }
    };

    // 브라우저 열기
    log::info!("OAuth 브라우저 열기: {}", provider.as_str());
    tauri::async_runtime::spawn_blocking({
        let url = authorize_url.clone();
        move || {
            let _ = open::that(&url);
        }
    })
    .await
    .map_err(|e| format!("브라우저 열기 실패: {e}"))?;

    // callback 대기 (blocking) — state 검증 포함
    let code = tauri::async_runtime::spawn_blocking(move || wait_for_auth_code(&listener, &state))
        .await
        .map_err(|e| format!("콜백 대기 실패: {e}"))??;

    log::info!("OAuth code 수신 완료 (code 길이: {})", code.len());

    // code → id_token 교환
    log::info!("{} 토큰 교환 시작...", provider.as_str());
    let id_token = match &provider {
        AuthProvider::Kakao => exchange_kakao_code(&code, &redirect_uri).await?,
        AuthProvider::Apple => exchange_apple_code(&code, &redirect_uri).await?,
    };
    log::info!("{} id_token 획득 완료", provider.as_str());

    // MOA 서버에 id_token 전송 → accessToken 발급
    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());
    let api = ApiClient::new(&base_url);

    log::info!("MOA 서버 로그인 시작 ({})", base_url);
    let access_token = api
        .auth_login(provider.as_str(), &id_token)
        .await
        .map_err(|e| format!("서버 로그인 실패: {e}"))?;

    // 토큰 저장
    auth::save_auth_token(&app, &access_token, provider.as_str())?;
    log::info!("{} 로그인 성공", provider.as_str());

    // 서버 데이터 sync
    let needs_onboarding = sync_after_login(&app, &api, &access_token).await?;

    // OAuth 완료 후 앱 패널 자동 표시
    crate::tray::show_main_window(&app);

    Ok(LoginResult {
        is_logged_in: true,
        needs_onboarding,
    })
}

/// 진행 중인 소셜 로그인 취소
#[tauri::command]
#[specta::specta]
pub async fn cancel_social_login() -> Result<(), String> {
    SOCIAL_LOGIN_CANCELLED.store(true, Ordering::Relaxed);
    log::info!("소셜 로그인 취소 요청됨");
    Ok(())
}

/// 로그아웃
#[tauri::command]
#[specta::specta]
pub async fn logout(app: AppHandle) -> Result<(), String> {
    auth::clear_auth_token(&app);
    log::info!("로그아웃 완료");
    Ok(())
}

/// 인증 상태 확인
#[tauri::command]
#[specta::specta]
pub async fn get_auth_status(app: AppHandle) -> Result<AuthStatus, String> {
    let store = app.state::<auth::AuthStore>();
    let guard = store.0.lock().unwrap();
    match guard.as_ref() {
        Some(state) => {
            let provider = match state.provider.as_str() {
                "kakao" => Some(AuthProvider::Kakao),
                "apple" => Some(AuthProvider::Apple),
                _ => None,
            };
            Ok(AuthStatus {
                is_logged_in: true,
                provider,
            })
        }
        None => Ok(AuthStatus {
            is_logged_in: false,
            provider: None,
        }),
    }
}

/// 서버에서 프로필 닉네임 조회
#[tauri::command]
#[specta::specta]
pub async fn get_profile_nickname(app: AppHandle) -> Result<Option<String>, String> {
    let token = match auth::get_access_token(&app) {
        Some(t) => t,
        None => return Ok(None),
    };

    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());
    let api = ApiClient::new(&base_url);

    match api.get_profile(&token).await {
        Ok(profile) => Ok(Some(profile.nickname)),
        Err(ApiError::Unauthorized) => {
            auth::clear_auth_token(&app);
            Ok(None)
        }
        Err(e) => Err(format!("프로필 조회 실패: {e}")),
    }
}

/// 로컬 설정 → 서버 push (fire-and-forget 용)
#[tauri::command]
#[specta::specta]
pub async fn sync_settings_to_server(app: AppHandle) -> Result<(), String> {
    let token = match auth::get_access_token(&app) {
        Some(t) => t,
        None => return Ok(()), // 비로그인 시 skip
    };

    let settings = load_local_settings(&app)?;
    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());
    let api = ApiClient::new(&base_url);

    // payroll
    let payroll_req = PayrollPatchRequest {
        salary_input_type: to_server_salary_type(&settings.salary_type),
        salary_amount: settings.salary_amount as i64,
    };
    if let Err(e) = api.patch_payroll(&token, &payroll_req).await {
        if handle_api_error(&app, &e, "payroll push") {
            return Ok(()); // 토큰 만료 — 이후 PATCH 중단
        }
    }

    // work-policy
    let work_policy_req = WorkPolicyPatchRequest {
        workdays: settings
            .work_days
            .iter()
            .filter_map(|&d| Weekday::from_local_index(d))
            .collect(),
        clock_in_time: settings.work_start_time.clone(),
        clock_out_time: settings.work_end_time.clone(),
    };
    if let Err(e) = api.patch_work_policy(&token, &work_policy_req).await {
        if handle_api_error(&app, &e, "work-policy push") {
            return Ok(());
        }
    }

    // payday
    let payday_req = PaydayPatchRequest {
        payday_day: settings.pay_day as i32,
    };
    if let Err(e) = api.patch_profile_payday(&token, &payday_req).await {
        handle_api_error(&app, &e, "payday push");
    }

    log::info!("설정 서버 push 완료");
    Ok(())
}

// ============================================================================
// Server sync (RAII guard로 모든 진입점 직렬화)
// ============================================================================

static SYNC_IN_FLIGHT: AtomicBool = AtomicBool::new(false);

/// `SYNC_IN_FLIGHT` 플래그를 Drop 시 항상 false로 되돌리는 RAII 가드.
/// panic 시에도 unwind 중 drop이 실행되어 플래그가 영구 true로 고정되는 걸 방지.
struct SyncGuard;

impl Drop for SyncGuard {
    fn drop(&mut self) {
        SYNC_IN_FLIGHT.store(false, Ordering::SeqCst);
    }
}

/// 서버 데이터 → 로컬 pull. 동시 호출은 스킵됨 (폴링/panel-shown/수동 invoke 모두 직렬화).
#[tauri::command]
#[specta::specta]
pub async fn sync_from_server(app: AppHandle) -> Result<(), String> {
    if SYNC_IN_FLIGHT
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        log::debug!("sync_from_server 이미 실행 중 — 스킵");
        return Ok(());
    }
    let _guard = SyncGuard;

    let token = match auth::get_access_token(&app) {
        Some(t) => t,
        None => return Ok(()), // 비로그인 시 skip
    };

    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());
    let api = ApiClient::new(&base_url);

    // 서버에서 데이터 fetch (순차 — tokio 직접 의존 회피)
    let payroll = api.get_payroll(&token).await;
    let work_policy = api.get_work_policy(&token).await;
    let profile = api.get_profile(&token).await;

    // 401 체크
    if matches!(&payroll, Err(ApiError::Unauthorized))
        || matches!(&work_policy, Err(ApiError::Unauthorized))
        || matches!(&profile, Err(ApiError::Unauthorized))
    {
        auth::clear_auth_token(&app);
        log::info!("토큰 만료 — 자동 로그아웃");
        return Ok(());
    }

    // 하나라도 실패하면 skip (네트워크 에러 등)
    let (Ok(payroll), Ok(work_policy), Ok(profile)) = (payroll, work_policy, profile) else {
        log::warn!("서버 데이터 fetch 실패 — sync 건너뜀");
        return Ok(());
    };

    // 로컬 설정 로드
    let mut settings = load_local_settings(&app)?;
    let changed = merge_server_to_local(&mut settings, &payroll, &work_policy, &profile);

    if changed {
        save_user_settings_sync(&app, &settings)?;
        salary::notify_settings_changed();
        log::info!("서버 → 로컬 sync 완료 (변경 있음)");
    } else {
        log::debug!("서버 → 로컬 sync: 변경 없음");
    }

    Ok(())
}

// ============================================================================
// Internal helpers
// ============================================================================

/// 로그인 후 서버 데이터 동기화. 온보딩 필요 여부 반환.
async fn sync_after_login(app: &AppHandle, api: &ApiClient, token: &str) -> Result<bool, String> {
    let status = api
        .get_onboarding_status(token)
        .await
        .map_err(|e| format!("온보딩 상태 확인 실패: {e}"))?;

    let server_has_data =
        status.payroll.is_some() && status.work_policy.is_some() && status.profile.is_some();

    if server_has_data {
        // 서버 → 로컬 sync
        let payroll = status.payroll.unwrap();
        let work_policy = status.work_policy.unwrap();
        let profile = status.profile.unwrap();

        let mut settings = load_local_settings(app).unwrap_or_default();
        merge_server_to_local(&mut settings, &payroll, &work_policy, &profile);
        settings.onboarding_completed = true;
        save_user_settings_sync(app, &settings)?;
        salary::notify_settings_changed();
        log::info!("서버 데이터 → 로컬 sync 완료");
        Ok(false) // 온보딩 불필요
    } else {
        // 로컬 설정이 있으면 서버에 push
        let settings = load_local_settings(app);
        if let Ok(ref s) = settings {
            if s.onboarding_completed {
                push_local_to_server(app, api, token, s).await;
                log::info!("로컬 데이터 → 서버 push 완료");
                return Ok(false);
            }
        }
        Ok(true) // 온보딩 필요
    }
}

/// 서버 데이터를 로컬 설정에 머지. 변경 여부 반환.
fn merge_server_to_local(
    settings: &mut UserSettings,
    payroll: &crate::api_client::PayrollResponse,
    work_policy: &crate::api_client::WorkPolicyResponse,
    profile: &crate::api_client::ProfileResponse,
) -> bool {
    let new_salary_type = from_server_salary_type(&payroll.salary_input_type);
    let new_amount = u32::try_from(payroll.salary_amount.max(0)).unwrap_or(settings.salary_amount);
    let new_pay_day = if (1..=31).contains(&profile.payday_day) {
        profile.payday_day as u8
    } else {
        settings.pay_day
    };
    let new_work_days: Vec<u8> = work_policy
        .workdays
        .iter()
        .map(|d| d.to_local_index())
        .collect();
    let new_start = &work_policy.clock_in_time;
    let new_end = &work_policy.clock_out_time;

    let changed = settings.salary_type != new_salary_type
        || settings.salary_amount != new_amount
        || settings.pay_day != new_pay_day
        || settings.work_days != new_work_days
        || settings.work_start_time != *new_start
        || settings.work_end_time != *new_end;

    if changed {
        settings.salary_type = new_salary_type;
        settings.salary_amount = new_amount;
        settings.pay_day = new_pay_day;
        settings.work_days = new_work_days;
        settings.work_start_time = new_start.clone();
        settings.work_end_time = new_end.clone();
    }

    changed
}

/// 로컬 설정을 서버에 push (best-effort, 401 감지 시 조기 중단)
async fn push_local_to_server(
    app: &AppHandle,
    api: &ApiClient,
    token: &str,
    settings: &UserSettings,
) {
    let payroll_req = PayrollPatchRequest {
        salary_input_type: to_server_salary_type(&settings.salary_type),
        salary_amount: settings.salary_amount as i64,
    };
    let work_policy_req = WorkPolicyPatchRequest {
        workdays: settings
            .work_days
            .iter()
            .filter_map(|&d| Weekday::from_local_index(d))
            .collect(),
        clock_in_time: settings.work_start_time.clone(),
        clock_out_time: settings.work_end_time.clone(),
    };
    let payday_req = PaydayPatchRequest {
        payday_day: settings.pay_day as i32,
    };

    if let Err(e) = api.patch_payroll(token, &payroll_req).await {
        if handle_api_error(app, &e, "payroll push (login)") {
            return;
        }
    }
    if let Err(e) = api.patch_work_policy(token, &work_policy_req).await {
        if handle_api_error(app, &e, "work-policy push (login)") {
            return;
        }
    }
    if let Err(e) = api.patch_profile_payday(token, &payday_req).await {
        handle_api_error(app, &e, "payday push (login)");
    }
}

fn load_local_settings(app: &AppHandle) -> Result<UserSettings, String> {
    let path = get_user_settings_path(app)?;
    if !path.exists() {
        return Ok(UserSettings::default());
    }
    let contents = std::fs::read_to_string(&path).map_err(|e| format!("설정 읽기 실패: {e}"))?;
    serde_json::from_str(&contents).map_err(|e| format!("설정 파싱 실패: {e}"))
}

fn to_server_salary_type(t: &SalaryType) -> SalaryInputType {
    match t {
        SalaryType::Yearly => SalaryInputType::Annual,
        SalaryType::Monthly => SalaryInputType::Monthly,
    }
}

fn from_server_salary_type(t: &SalaryInputType) -> SalaryType {
    match t {
        SalaryInputType::Annual => SalaryType::Yearly,
        SalaryInputType::Monthly => SalaryType::Monthly,
    }
}

/// API 에러 처리 공통 훅. 401이었으면 true (caller 조기 중단 신호).
fn handle_api_error(app: &AppHandle, error: &ApiError, context: &str) -> bool {
    match error {
        ApiError::Unauthorized => {
            auth::clear_auth_token(app);
            log::info!("토큰 만료 ({context}) — 자동 로그아웃");
            true
        }
        _ => {
            log::warn!("{context} 실패: {error}");
            false
        }
    }
}

fn urlencoded(s: &str) -> String {
    s.replace(':', "%3A").replace('/', "%2F")
}
