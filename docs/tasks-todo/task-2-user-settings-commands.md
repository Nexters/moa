# Task 2: 사용자 설정 커맨드

## 목표

사용자 설정을 저장하고 불러오는 Tauri 커맨드를 구현한다.

## 스펙 참조

- [MVP 스펙](../mvp-spec.md)
- [Tauri 커맨드 가이드](../developer/tauri-commands.md)

## 구현 내용

### 1. 커맨드 파일 생성 (`src-tauri/src/commands/user_settings.rs`)

```rust
//! 사용자 설정 관리 커맨드

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use crate::types::UserSettings;

/// 사용자 설정 파일 경로
fn get_user_settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("앱 데이터 디렉토리 접근 실패: {e}"))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("디렉토리 생성 실패: {e}"))?;

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

    let contents = std::fs::read_to_string(&path)
        .map_err(|e| format!("설정 파일 읽기 실패: {e}"))?;

    let settings: UserSettings = serde_json::from_str(&contents)
        .map_err(|e| format!("설정 파싱 실패: {e}"))?;

    log::info!("사용자 설정 로드 완료");
    Ok(settings)
}

/// 사용자 설정 저장
#[tauri::command]
#[specta::specta]
pub async fn save_user_settings(app: AppHandle, settings: UserSettings) -> Result<(), String> {
    // Validation
    crate::types::validate_salary(settings.monthly_net_salary)?;
    crate::types::validate_pay_day(settings.pay_day)?;

    let path = get_user_settings_path(&app)?;

    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("직렬화 실패: {e}"))?;

    // Atomic write
    let temp_path = path.with_extension("tmp");
    std::fs::write(&temp_path, json)
        .map_err(|e| format!("임시 파일 쓰기 실패: {e}"))?;

    std::fs::rename(&temp_path, &path)
        .map_err(|e| format!("파일 저장 실패: {e}"))?;

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
```

### 2. mod.rs에 모듈 등록

```rust
// src-tauri/src/commands/mod.rs
pub mod user_settings;
```

### 3. lib.rs에 커맨드 등록

```rust
// invoke_handler에 추가
commands::user_settings::load_user_settings,
commands::user_settings::save_user_settings,
commands::user_settings::is_onboarding_completed,
```

### 4. Frontend에서 사용

```typescript
import { commands, unwrapResult } from '~/lib/tauri-bindings';

// 설정 불러오기
const settings = unwrapResult(await commands.loadUserSettings());

// 설정 저장
await commands.saveUserSettings({
  nickname: '성실한 뚱이',
  companyName: '집게리아',
  monthlyNetSalary: 3000000,
  payDay: 25,
  onboardingCompleted: true,
});
```

## 완료 조건

- [ ] `load_user_settings` 커맨드 구현
- [ ] `save_user_settings` 커맨드 구현
- [ ] `is_onboarding_completed` 커맨드 구현
- [ ] `bun tauri:gen` 실행하여 바인딩 생성
- [ ] 커맨드 테스트

## 의존성

- [Task 1: 데이터 모델 설계](task-1-data-model.md)

## 다음 태스크

- [Task 3: 급여 계산 엔진](task-3-salary-calculator.md)
