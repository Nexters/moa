//! 약관 동의 커맨드. `/api/v1/onboarding/terms` + `/api/v1/onboarding/terms/agreements` 래핑.

use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::AppHandle;

use crate::api_client::{ApiClient, ApiError, TermAgreementUpsertDto, TermsAgreementRequest};
use crate::auth;
use crate::commands::auth::load_local_settings;
use crate::commands::user_settings::save_user_settings_sync;

#[derive(Debug, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TermItem {
    pub code: String,
    pub title: String,
    pub required: bool,
    pub content_url: String,
}

#[derive(Debug, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct TermAgreementInput {
    pub code: String,
    pub agreed: bool,
}

const MARKETING_CODE: &str = "MARKETING";

fn api_client() -> ApiClient {
    let base_url = std::env::var("MOA_API_BASE_URL")
        .unwrap_or_else(|_| "https://www.moa-official.kr".to_string());
    ApiClient::new(&base_url)
}

fn require_token(app: &AppHandle) -> Result<String, String> {
    auth::get_access_token(app).ok_or_else(|| "로그인이 필요합니다".to_string())
}

/// GET /api/v1/onboarding/terms
#[tauri::command]
#[specta::specta]
pub async fn get_onboarding_terms(app: AppHandle) -> Result<Vec<TermItem>, String> {
    let token = require_token(&app)?;
    let api = api_client();

    let resp = api.get_onboarding_terms(&token).await.map_err(|e| {
        if matches!(e, ApiError::Unauthorized) {
            auth::clear_auth_token(&app);
        }
        format!("약관 조회 실패: {e}")
    })?;

    Ok(resp
        .terms
        .into_iter()
        .map(|t| TermItem {
            code: t.code,
            title: t.title,
            required: t.required,
            content_url: t.content_url,
        })
        .collect())
}

/// PUT /api/v1/onboarding/terms/agreements — 응답으로 has_required_terms_agreed 반환.
/// 로컬 `UserSettings`의 `terms_agreed`/`terms_marketing_agreed`도 함께 갱신.
#[tauri::command]
#[specta::specta]
pub async fn submit_onboarding_terms_agreements(
    app: AppHandle,
    agreements: Vec<TermAgreementInput>,
) -> Result<bool, String> {
    let token = require_token(&app)?;
    let api = api_client();

    let req = TermsAgreementRequest {
        agreements: agreements
            .into_iter()
            .map(|a| TermAgreementUpsertDto {
                code: a.code,
                agreed: a.agreed,
            })
            .collect(),
    };

    let resp = api
        .put_onboarding_terms_agreements(&token, &req)
        .await
        .map_err(|e| {
            if matches!(e, ApiError::Unauthorized) {
                auth::clear_auth_token(&app);
            }
            format!("약관 동의 저장 실패: {e}")
        })?;

    let marketing_agreed = resp
        .agreements
        .iter()
        .find(|a| a.code == MARKETING_CODE)
        .map(|a| a.agreed)
        .unwrap_or(false);

    let mut settings = load_local_settings(&app).unwrap_or_default();
    settings.terms_agreed = resp.has_required_terms_agreed;
    settings.terms_marketing_agreed = marketing_agreed;
    save_user_settings_sync(&app, &settings)?;

    log::info!(
        "약관 동의 저장 완료: required={}, marketing={}",
        resp.has_required_terms_agreed,
        marketing_agreed,
    );

    Ok(resp.has_required_terms_agreed)
}
