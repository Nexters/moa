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
// Terms (약관)
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TermDto {
    pub code: String,
    pub title: String,
    pub required: bool,
    pub content_url: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TermsResponse {
    pub terms: Vec<TermDto>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TermAgreementUpsertDto {
    pub code: String,
    pub agreed: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TermsAgreementRequest {
    pub agreements: Vec<TermAgreementUpsertDto>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TermAgreementDto {
    pub code: String,
    pub agreed: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TermsAgreementsResponse {
    pub agreements: Vec<TermAgreementDto>,
    pub has_required_terms_agreed: bool,
}

// ============================================================================
// Workday
// ============================================================================

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum WorkdayType {
    Work,
    Vacation,
    None,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum WorkdayStatus {
    None,
    Scheduled,
    Completed,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WorkdayEvent {
    Payday,
    PublicHoliday,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkdayResponse {
    pub date: String,
    #[serde(rename = "type")]
    pub workday_type: WorkdayType,
    pub status: WorkdayStatus,
    pub events: Vec<WorkdayEvent>,
    pub daily_pay: i32,
    pub clock_in_time: Option<String>,
    pub clock_out_time: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkdayUpsertRequest {
    #[serde(rename = "type")]
    pub workday_type: WorkdayType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clock_in_time: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clock_out_time: Option<String>,
}

/// PATCH /workdays/{date} 전용 — 조퇴/연장 시 clockOutTime만 수정.
///
/// 현재 mutate_workday는 일관성을 위해 PUT만 사용한다. PATCH는 향후 효율 최적화나
/// 별도 액션(조퇴 전용 UI 등)을 위해 유지된다.
#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkdayEditRequest {
    pub clock_out_time: String,
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

#[derive(Debug, Serialize)]
pub struct WithdrawalRequest {
    pub reason: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NicknamePatchRequest {
    pub nickname: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkplacePatchRequest {
    pub workplace: String,
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

    /// GET /api/v1/onboarding/terms
    pub async fn get_onboarding_terms(&self, token: &str) -> Result<TermsResponse, ApiError> {
        self.get("/api/v1/onboarding/terms", token).await
    }

    /// PUT /api/v1/onboarding/terms/agreements
    pub async fn put_onboarding_terms_agreements(
        &self,
        token: &str,
        req: &TermsAgreementRequest,
    ) -> Result<TermsAgreementsResponse, ApiError> {
        self.put_with_response("/api/v1/onboarding/terms/agreements", token, req)
            .await
    }

    /// POST /api/v1/member/withdrawal
    pub async fn post_withdrawal(&self, token: &str, reasons: Vec<String>) -> Result<(), ApiError> {
        let body = WithdrawalRequest { reason: reasons };
        self.post_unit("/api/v1/member/withdrawal", token, &body)
            .await
    }

    /// PATCH /api/v1/profile/nickname
    pub async fn patch_profile_nickname(
        &self,
        token: &str,
        req: &NicknamePatchRequest,
    ) -> Result<ProfileResponse, ApiError> {
        self.patch_with_response("/api/v1/profile/nickname", token, req)
            .await
    }

    /// PATCH /api/v1/profile/workplace
    pub async fn patch_profile_workplace(
        &self,
        token: &str,
        req: &WorkplacePatchRequest,
    ) -> Result<(), ApiError> {
        self.patch("/api/v1/profile/workplace", token, req).await
    }

    /// PATCH /api/v1/onboarding/payroll — 온보딩 단계용 (서버 온보딩 완료 시그널)
    pub async fn patch_onboarding_payroll(
        &self,
        token: &str,
        req: &PayrollPatchRequest,
    ) -> Result<(), ApiError> {
        self.patch("/api/v1/onboarding/payroll", token, req).await
    }

    /// PATCH /api/v1/onboarding/work-policy — 온보딩 단계용
    pub async fn patch_onboarding_work_policy(
        &self,
        token: &str,
        req: &WorkPolicyPatchRequest,
    ) -> Result<(), ApiError> {
        self.patch("/api/v1/onboarding/work-policy", token, req)
            .await
    }

    /// PATCH /api/v1/onboarding/profile — 온보딩 단계용 (nickname 필수)
    pub async fn patch_onboarding_profile(
        &self,
        token: &str,
        req: &NicknamePatchRequest,
    ) -> Result<(), ApiError> {
        self.patch("/api/v1/onboarding/profile", token, req).await
    }

    /// GET /api/v1/workdays/{date}
    pub async fn get_workday(&self, token: &str, date: &str) -> Result<WorkdayResponse, ApiError> {
        self.get(&format!("/api/v1/workdays/{date}"), token).await
    }

    /// PUT /api/v1/workdays/{date} — 전체 upsert
    pub async fn put_workday(
        &self,
        token: &str,
        date: &str,
        req: &WorkdayUpsertRequest,
    ) -> Result<(), ApiError> {
        self.put_unit(&format!("/api/v1/workdays/{date}"), token, req)
            .await
    }

    /// PATCH /api/v1/workdays/{date} — 퇴근시간만 수정 (조퇴/연장)
    #[allow(dead_code)]
    pub async fn patch_workday(
        &self,
        token: &str,
        date: &str,
        req: &WorkdayEditRequest,
    ) -> Result<(), ApiError> {
        self.patch(&format!("/api/v1/workdays/{date}"), token, req)
            .await
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

    async fn put_with_response<B: Serialize, T: serde::de::DeserializeOwned>(
        &self,
        path: &str,
        token: &str,
        body: &B,
    ) -> Result<T, ApiError> {
        let url = format!("{}{}", self.base_url, path);
        let resp = self
            .http
            .put(&url)
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

        let api_resp: ApiResponse<T> = resp
            .json()
            .await
            .map_err(|e| ApiError::Network(e.to_string()))?;

        api_resp
            .content
            .ok_or_else(|| ApiError::Server("응답에 content 없음".into()))
    }

    async fn post_unit<B: Serialize>(
        &self,
        path: &str,
        token: &str,
        body: &B,
    ) -> Result<(), ApiError> {
        let url = format!("{}{}", self.base_url, path);
        let resp = self
            .http
            .post(&url)
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

    async fn put_unit<B: Serialize>(
        &self,
        path: &str,
        token: &str,
        body: &B,
    ) -> Result<(), ApiError> {
        let url = format!("{}{}", self.base_url, path);
        let resp = self
            .http
            .put(&url)
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

    async fn patch_with_response<T, B>(
        &self,
        path: &str,
        token: &str,
        body: &B,
    ) -> Result<T, ApiError>
    where
        T: serde::de::DeserializeOwned,
        B: Serialize,
    {
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

        let api_resp: ApiResponse<T> = resp
            .json()
            .await
            .map_err(|e| ApiError::Network(e.to_string()))?;

        api_resp
            .content
            .ok_or_else(|| ApiError::Server("응답에 content 없음".into()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn workday_type_serializes_as_uppercase() {
        assert_eq!(
            serde_json::to_string(&WorkdayType::Work).unwrap(),
            "\"WORK\""
        );
        assert_eq!(
            serde_json::to_string(&WorkdayType::Vacation).unwrap(),
            "\"VACATION\""
        );
        assert_eq!(
            serde_json::to_string(&WorkdayType::None).unwrap(),
            "\"NONE\""
        );
    }

    #[test]
    fn workday_type_deserializes_uppercase() {
        assert_eq!(
            serde_json::from_str::<WorkdayType>("\"WORK\"").unwrap(),
            WorkdayType::Work
        );
        assert_eq!(
            serde_json::from_str::<WorkdayType>("\"NONE\"").unwrap(),
            WorkdayType::None
        );
    }

    #[test]
    fn workday_status_serde_round_trip() {
        for status in [
            WorkdayStatus::None,
            WorkdayStatus::Scheduled,
            WorkdayStatus::Completed,
        ] {
            let s = serde_json::to_string(&status).unwrap();
            let back: WorkdayStatus = serde_json::from_str(&s).unwrap();
            assert_eq!(status, back);
        }
        assert_eq!(
            serde_json::to_string(&WorkdayStatus::Completed).unwrap(),
            "\"COMPLETED\""
        );
    }

    #[test]
    fn workday_event_screaming_snake_case() {
        assert_eq!(
            serde_json::to_string(&WorkdayEvent::Payday).unwrap(),
            "\"PAYDAY\""
        );
        assert_eq!(
            serde_json::to_string(&WorkdayEvent::PublicHoliday).unwrap(),
            "\"PUBLIC_HOLIDAY\""
        );
        assert_eq!(
            serde_json::from_str::<WorkdayEvent>("\"PUBLIC_HOLIDAY\"").unwrap(),
            WorkdayEvent::PublicHoliday
        );
    }

    #[test]
    fn workday_response_deserializes_camel_case() {
        let json = r#"{
            "date": "2026-05-25",
            "type": "VACATION",
            "status": "COMPLETED",
            "events": ["PUBLIC_HOLIDAY"],
            "dailyPay": 100000,
            "clockInTime": "09:00",
            "clockOutTime": "18:00"
        }"#;
        let parsed: WorkdayResponse = serde_json::from_str(json).unwrap();
        assert_eq!(parsed.date, "2026-05-25");
        assert_eq!(parsed.workday_type, WorkdayType::Vacation);
        assert_eq!(parsed.status, WorkdayStatus::Completed);
        assert_eq!(parsed.events, vec![WorkdayEvent::PublicHoliday]);
        assert_eq!(parsed.daily_pay, 100000);
        assert_eq!(parsed.clock_in_time.as_deref(), Some("09:00"));
        assert_eq!(parsed.clock_out_time.as_deref(), Some("18:00"));
    }

    #[test]
    fn workday_response_handles_missing_optional_times() {
        let json = r#"{
            "date": "2026-05-25",
            "type": "NONE",
            "status": "NONE",
            "events": [],
            "dailyPay": 0
        }"#;
        let parsed: WorkdayResponse = serde_json::from_str(json).unwrap();
        assert_eq!(parsed.workday_type, WorkdayType::None);
        assert!(parsed.clock_in_time.is_none());
        assert!(parsed.clock_out_time.is_none());
        assert!(parsed.events.is_empty());
    }

    #[test]
    fn workday_upsert_request_serializes_type_field_and_omits_none_times() {
        let req = WorkdayUpsertRequest {
            workday_type: WorkdayType::Vacation,
            clock_in_time: None,
            clock_out_time: None,
        };
        let s = serde_json::to_string(&req).unwrap();
        assert_eq!(s, r#"{"type":"VACATION"}"#);
    }

    #[test]
    fn workday_upsert_request_includes_times_when_present() {
        let req = WorkdayUpsertRequest {
            workday_type: WorkdayType::Work,
            clock_in_time: Some("09:00".into()),
            clock_out_time: Some("18:00".into()),
        };
        let parsed: serde_json::Value = serde_json::from_str(&serde_json::to_string(&req).unwrap()).unwrap();
        assert_eq!(parsed["type"], "WORK");
        assert_eq!(parsed["clockInTime"], "09:00");
        assert_eq!(parsed["clockOutTime"], "18:00");
    }

    #[test]
    fn workday_edit_request_serializes_clock_out_time() {
        let req = WorkdayEditRequest {
            clock_out_time: "20:30".into(),
        };
        assert_eq!(
            serde_json::to_string(&req).unwrap(),
            r#"{"clockOutTime":"20:30"}"#
        );
    }
}
