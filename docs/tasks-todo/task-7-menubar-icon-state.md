# Task 7: 메뉴바 아이콘 상태

## 목표

근무/비근무 시간에 따라 메뉴바 아이콘이 다르게 표시되도록 구현한다.

## 스펙 참조

- [MVP 스펙](../mvp-spec.md)

## 아이콘 상태

| 상태           | 조건                                         | 아이콘                   |
| -------------- | -------------------------------------------- | ------------------------ |
| 활성 (Working) | 근무요일(월~금) + 근무시간(09:00~18:00) 내   | 활성 아이콘 (예: 컬러)   |
| 비활성 (Idle)  | 비근무요일(토,일) 또는 근무시간 외           | 비활성 아이콘 (예: 회색) |

## 구현 내용

### 1. 아이콘 파일 준비

```
apps/app/src-tauri/icons/
├── tray-active.png      # 근무중 아이콘 (컬러)
├── tray-active@2x.png   # Retina용
├── tray-idle.png        # 비근무 아이콘 (회색)
└── tray-idle@2x.png     # Retina용
```

### 2. Rust: 아이콘 상태 변경 커맨드 (`src-tauri/src/commands/tray.rs`)

```rust
use tauri::{AppHandle, Manager, tray::TrayIconBuilder};
use tauri::image::Image;

/// 트레이 아이콘 상태
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayIconState {
    Active,
    Idle,
}

/// 트레이 아이콘 업데이트
#[tauri::command]
#[specta::specta]
pub async fn set_tray_icon_state(app: AppHandle, is_working: bool) -> Result<(), String> {
    let icon_path = if is_working {
        "icons/tray-active.png"
    } else {
        "icons/tray-idle.png"
    };

    let tray = app
        .tray_by_id("main")
        .ok_or("트레이 아이콘을 찾을 수 없습니다")?;

    let icon = Image::from_path(icon_path)
        .map_err(|e| format!("아이콘 로드 실패: {e}"))?;

    tray.set_icon(Some(icon))
        .map_err(|e| format!("아이콘 설정 실패: {e}"))?;

    log::info!("트레이 아이콘 상태 변경: {}", if is_working { "활성" } else { "비활성" });
    Ok(())
}
```

### 3. React: 아이콘 상태 동기화 Hook (`src/hooks/use-tray-icon-sync.ts`)

```typescript
import { useEffect, useRef } from 'react';
import { commands } from '~/lib/tauri-bindings';

export function useTrayIconSync(isWorking: boolean | null) {
  const prevState = useRef<boolean | null>(null);

  useEffect(() => {
    // null이면 아직 로딩 중
    if (isWorking === null) return;

    // 상태 변경 없으면 스킵
    if (prevState.current === isWorking) return;

    prevState.current = isWorking;

    // Rust 커맨드 호출
    commands.setTrayIconState(isWorking).catch((err) => {
      console.error('트레이 아이콘 상태 변경 실패:', err);
    });
  }, [isWorking]);
}
```

### 4. App에서 Hook 사용

```typescript
// src/app.tsx
import { useSalaryCalculator } from '~/hooks/use-salary-calculator';
import { useUserSettings } from '~/hooks/use-user-settings';
import { useTrayIconSync } from '~/hooks/use-tray-icon-sync';

export function App() {
  const { data: settings } = useUserSettings();
  const salaryInfo = useSalaryCalculator(settings ?? null);

  // 트레이 아이콘 동기화
  useTrayIconSync(salaryInfo?.workStatus === 'working' ?? null);

  // ...
}
```

### 5. 주기적 상태 체크 (Rust 타이머)

근무 시간 시작/종료 시점에 자동으로 아이콘이 변경되도록 타이머 설정:

```rust
// src-tauri/src/lib.rs
use std::time::Duration;
use tokio::time::interval;
use chrono::{Local, Datelike, Timelike};

/// 현재 근무 중인지 확인 (고정 근무 설정 사용)
fn check_is_working_time() -> bool {
    let now = Local::now();
    let day_of_week = now.weekday().num_days_from_sunday(); // 0=일, 1=월, ..., 6=토

    // 월~금 (1~5) 확인
    if day_of_week < 1 || day_of_week > 5 {
        return false;
    }

    // 09:00~18:00 확인
    let hour = now.hour();
    hour >= 9 && hour < 18
}

async fn start_tray_icon_watcher(app: AppHandle) {
    let mut interval = interval(Duration::from_secs(60)); // 1분마다 체크

    loop {
        interval.tick().await;

        // 온보딩 완료 여부 확인
        if let Ok(settings) = load_user_settings_internal(&app) {
            if settings.onboarding_completed {
                let is_working = check_is_working_time();
                let _ = update_tray_icon(&app, is_working);
            }
        }
    }
}
```

## 대안: Frontend에서 주기적 업데이트

Rust 타이머 대신 React에서 처리할 수도 있음:

```typescript
// useSalaryCalculator에서 이미 1초마다 계산하므로
// workStatus 변경 시 자동으로 useTrayIconSync가 트리거됨
```

## 파일 구조

```
apps/app/
├── src-tauri/
│   ├── icons/
│   │   ├── tray-active.png
│   │   ├── tray-active@2x.png
│   │   ├── tray-idle.png
│   │   └── tray-idle@2x.png
│   └── src/
│       └── commands/
│           └── tray.rs
└── src/
    └── hooks/
        └── use-tray-icon-sync.ts
```

## 완료 조건

- [ ] 활성/비활성 아이콘 디자인 및 파일 추가
- [ ] `set_tray_icon_state` 커맨드 구현
- [ ] `useTrayIconSync` 훅 구현
- [ ] App에서 훅 연결
- [ ] 근무 시작/종료 시점 아이콘 전환 테스트
- [ ] macOS/Windows 양쪽 테스트

## 의존성

- [Task 3: 급여 계산 엔진](task-3-salary-calculator.md)
- [Task 5: 메뉴바 팝업 UI](task-5-menubar-popup-ui.md)

## 완료 후

MVP 1차 기능 완료!
