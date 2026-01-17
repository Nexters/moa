# Task 1: 데이터 모델 설계

## 목표

MVP에 필요한 사용자 설정 데이터 모델을 Rust와 TypeScript 양쪽에 정의한다.

## 스펙 참조

- [MVP 스펙](../mvp-spec.md)

## 구현 내용

### 1. Rust 타입 정의 (`src-tauri/src/types.rs`)

```rust
/// 사용자 설정 (MVP)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UserSettings {
    /// 닉네임 (랜덤 생성)
    pub nickname: String,

    /// 회사명/근무지명 (랜덤 생성)
    pub company_name: String,

    /// 월 실수령액 (원)
    pub monthly_net_salary: u64,

    /// 월급날 (1~31, 기본값: 25)
    pub pay_day: u8,

    /// 온보딩 완료 여부
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

/// 근무 설정 상수 (고정값)
pub const WORK_DAYS: [u8; 5] = [1, 2, 3, 4, 5]; // 월~금
pub const WORK_START_TIME: &str = "09:00";
pub const WORK_END_TIME: &str = "18:00";
pub const WORK_HOURS_PER_DAY: u8 = 9; // 9시간
```

### 2. 랜덤 생성 함수

```rust
/// 랜덤 닉네임 생성
pub fn generate_random_nickname() -> String {
    let adjectives = ["성실한", "부지런한", "열정적인", "꼼꼼한", "유능한", "프로"];
    let characters = ["뚱이", "징징이", "다람이", "핑핑이", "보노보노", "포차코"];

    let adj = adjectives[rand::random::<usize>() % adjectives.len()];
    let char = characters[rand::random::<usize>() % characters.len()];

    format!("{adj} {char}")
}

/// 랜덤 회사명 생성
pub fn generate_random_company() -> String {
    let companies = [
        "집게리아", "버거왕국", "초코파이공장", "별다방",
        "감자튀김연구소", "햄버거학교", "피자왕국", "치킨나라",
    ];

    companies[rand::random::<usize>() % companies.len()].to_string()
}
```

### 3. Validation 함수 추가

```rust
/// 급여 검증
pub fn validate_salary(salary: u64) -> Result<(), String> {
    if salary == 0 {
        return Err("월 실수령액은 0보다 커야 합니다".to_string());
    }
    Ok(())
}

/// 월급날 검증
pub fn validate_pay_day(day: u8) -> Result<(), String> {
    if day < 1 || day > 31 {
        return Err("월급날은 1~31 사이여야 합니다".to_string());
    }
    Ok(())
}
```

### 4. tauri-specta로 TypeScript 타입 자동 생성

`bun tauri:gen` 실행 시 자동으로 `tauri-bindings.gen.ts`에 타입 생성됨.

## 완료 조건

- [ ] `UserSettings` 구조체 정의 (nickname, companyName, monthlyNetSalary, payDay)
- [ ] 랜덤 생성 함수 추가 (generate_random_nickname, generate_random_company)
- [ ] Validation 함수 추가 (validate_salary, validate_pay_day)
- [ ] 근무 설정 상수 정의 (WORK_DAYS, WORK_START_TIME, WORK_END_TIME)
- [ ] `bun tauri:gen` 실행하여 TypeScript 타입 생성 확인
