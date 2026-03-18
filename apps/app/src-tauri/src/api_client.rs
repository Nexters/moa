//! MOA 서버 API 클라이언트.

use reqwest::Client;
use serde::{Deserialize, Serialize};

/// 서버 공통 응답 구조
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct ApiResponse<T> {
    pub code: String,
    pub message: String,
    pub content: Option<T>,
}

/// 서버 에러 응답 (content가 없는 경우)
#[derive(Debug)]
pub enum ApiError {
    /// 401 — 토큰 만료 또는 미인증
    Unauthorized,
    /// 기타 서버 에러
    Server(String),
    /// 네트워크 에러
    Network(String),
}

impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ApiError::Unauthorized => write!(f, "인증 만료"),
            ApiError::Server(msg) => write!(f, "서버 에러: {msg}"),
            ApiError::Network(msg) => write!(f, "네트워크 에러: {msg}"),
        }
    }
}

// ============================================================================
// Auth responses
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthTokenResponse {
    pub access_token: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthRequest {
    pub id_token: String,
}

// ============================================================================
// Profile
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct ProfileResponse {
    pub nickname: String,
    pub workplace: Option<String>,
    pub payday_day: i32,
}

// ============================================================================
// Payroll
// ============================================================================

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PayrollResponse {
    pub salary_input_type: SalaryInputType,
    pub salary_amount: i64,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum SalaryInputType {
    Annual,
    Monthly,
}

// ============================================================================
// Work Policy
// ============================================================================

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkPolicyResponse {
    pub workdays: Vec<Weekday>,
    pub clock_in_time: String,
    pub clock_out_time: String,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum Weekday {
    Mon,
    Tue,
    Wed,
    Thu,
    Fri,
    Sat,
    Sun,
}

impl Weekday {
    /// 서버 요일 → 로컬 인덱스 (0=Sun, 1=Mon, ..., 6=Sat)
    pub fn to_local_index(&self) -> u8 {
        match self {
            Weekday::Sun => 0,
            Weekday::Mon => 1,
            Weekday::Tue => 2,
            Weekday::Wed => 3,
            Weekday::Thu => 4,
            Weekday::Fri => 5,
            Weekday::Sat => 6,
        }
    }

    /// 로컬 인덱스 → 서버 요일
    pub fn from_local_index(index: u8) -> Option<Self> {
        match index {
            0 => Some(Weekday::Sun),
            1 => Some(Weekday::Mon),
            2 => Some(Weekday::Tue),
            3 => Some(Weekday::Wed),
            4 => Some(Weekday::Thu),
            5 => Some(Weekday::Fri),
            6 => Some(Weekday::Sat),
            _ => None,
        }
    }
}

// ============================================================================
// Onboarding
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct OnboardingStatusResponse {
    pub profile: Option<ProfileResponse>,
    pub payroll: Option<PayrollResponse>,
    pub work_policy: Option<WorkPolicyResponse>,
    pub has_required_terms_agreed: bool,
}

// ============================================================================
// Patch requests
// ============================================================================

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PayrollPatchRequest {
    pub salary_input_type: SalaryInputType,
    pub salary_amount: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkPolicyPatchRequest {
    pub workdays: Vec<Weekday>,
    pub clock_in_time: String,
    pub clock_out_time: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaydayPatchRequest {
    pub payday_day: i32,
}

// ============================================================================
// API Client
// ============================================================================

pub struct ApiClient {
    base_url: String,
    http: Client,
}

impl ApiClient {
    pub fn new(base_url: &str) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            http: Client::new(),
        }
    }

    /// POST /api/v1/auth/{provider}
    pub async fn auth_login(&self, provider: &str, id_token: &str) -> Result<String, ApiError> {
        let url = format!("{}/api/v1/auth/{}", self.base_url, provider);
        let body = AuthRequest {
            id_token: id_token.to_string(),
        };

        let resp = self
            .http
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| ApiError::Network(e.to_string()))?;

        if resp.status() == 401 {
            return Err(ApiError::Unauthorized);
        }
        if !resp.status().is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(ApiError::Server(text));
        }

        let api_resp: ApiResponse<AuthTokenResponse> = resp
            .json()
            .await
            .map_err(|e| ApiError::Network(e.to_string()))?;

        api_resp
            .content
            .map(|c| c.access_token)
            .ok_or_else(|| ApiError::Server("응답에 accessToken 없음".into()))
    }

    /// GET /api/v1/onboarding/status
    pub async fn get_onboarding_status(
        &self,
        token: &str,
    ) -> Result<OnboardingStatusResponse, ApiError> {
        self.get("/api/v1/onboarding/status", token).await
    }

    /// GET /api/v1/profile
    pub async fn get_profile(&self, token: &str) -> Result<ProfileResponse, ApiError> {
        self.get("/api/v1/profile", token).await
    }

    /// GET /api/v1/payroll
    pub async fn get_payroll(&self, token: &str) -> Result<PayrollResponse, ApiError> {
        self.get("/api/v1/payroll", token).await
    }

    /// GET /api/v1/work-policy
    pub async fn get_work_policy(&self, token: &str) -> Result<WorkPolicyResponse, ApiError> {
        self.get("/api/v1/work-policy", token).await
    }

    /// PATCH /api/v1/payroll
    pub async fn patch_payroll(
        &self,
        token: &str,
        req: &PayrollPatchRequest,
    ) -> Result<(), ApiError> {
        self.patch("/api/v1/payroll", token, req).await
    }

    /// PATCH /api/v1/work-policy
    pub async fn patch_work_policy(
        &self,
        token: &str,
        req: &WorkPolicyPatchRequest,
    ) -> Result<(), ApiError> {
        self.patch("/api/v1/work-policy", token, req).await
    }

    /// PATCH /api/v1/profile/payday
    pub async fn patch_profile_payday(
        &self,
        token: &str,
        req: &PaydayPatchRequest,
    ) -> Result<(), ApiError> {
        self.patch("/api/v1/profile/payday", token, req).await
    }

    // -- helpers --

    async fn get<T: serde::de::DeserializeOwned>(
        &self,
        path: &str,
        token: &str,
    ) -> Result<T, ApiError> {
        let url = format!("{}{}", self.base_url, path);
        let resp = self
            .http
            .get(&url)
            .bearer_auth(token)
            .send()
            .await
            .map_err(|e| ApiError::Network(e.to_string()))?;

        if resp.status() == 401 {
            return Err(ApiError::Unauthorized);
        }
        if !resp.status().is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(ApiError::Server(text));
        }

        let api_resp: ApiResponse<T> = resp
            .json()
            .await
            .map_err(|e| ApiError::Network(e.to_string()))?;

        api_resp
            .content
            .ok_or_else(|| ApiError::Server("응답에 content 없음".into()))
    }

    async fn patch<B: Serialize>(&self, path: &str, token: &str, body: &B) -> Result<(), ApiError> {
        let url = format!("{}{}", self.base_url, path);
        let resp = self
            .http
            .patch(&url)
            .bearer_auth(token)
            .json(body)
            .send()
            .await
            .map_err(|e| ApiError::Network(e.to_string()))?;

        if resp.status() == 401 {
            return Err(ApiError::Unauthorized);
        }
        if !resp.status().is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(ApiError::Server(text));
        }

        Ok(())
    }
}
