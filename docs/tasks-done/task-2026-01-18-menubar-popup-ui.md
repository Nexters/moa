# Task 5: 메뉴바 팝업 UI

## 목표

메뉴바 아이콘 클릭 시 표시되는 커스텀 드롭다운 패널을 구현한다. RunCat 스타일의 2컬럼 레이아웃을 적용한다.

## 스펙 참조

- [MVP 스펙](../mvp-spec.md)
- [레퍼런스: tauri-macos-menubar-app-example](https://github.com/ahkohd/tauri-macos-menubar-app-example/tree/v2)

## 기술 구현 현황

### Rust 백엔드

| 기능                      | 상태    | 파일             |
| ------------------------- | ------- | ---------------- |
| `tauri-nspanel` 플러그인  | ✅ 완료 | `Cargo.toml`     |
| NSPanel 변환              | ✅ 완료 | `utils/macos.rs` |
| 패널 이벤트 리스너        | ✅ 완료 | `utils/macos.rs` |
| 코너 라운딩 (13px)        | ✅ 완료 | `utils/macos.rs` |
| 트레이 아이콘 클릭 핸들러 | ✅ 완료 | `tray.rs`        |
| **패널 위치 지정**        | ✅ 완료 | `utils/macos.rs` |

---

## 필수 요구 사항

### 패널 위치 지정 (P0 필수)

**문제**: 현재 `panel.show()`만 호출하여 패널이 임의의 위치에 표시됨

**요구 사항**: 트레이 아이콘 클릭 시 패널이 **아이콘 바로 아래**에 표시되어야 함

```
macOS 메뉴바  [아이콘A] [아이콘B] [Moa아이콘] [아이콘C]
                                      ↓ 클릭
                               ┌─────────────┐
                               │   패널 UI   │  ← 아이콘 기준 중앙 정렬
                               └─────────────┘
```

---

## 기술 전략

### 구현 방식: macOS 기본 API 활용 (외부 의존성 없음)

| API                          | 용도                                       |
| ---------------------------- | ------------------------------------------ |
| `NSEvent mouseLocation`      | 마우스 커서 위치 (트레이 아이콘 클릭 지점) |
| `NSScreen mainScreen`        | 현재 화면 정보                             |
| `NSScreen visibleFrame`      | 메뉴바 제외한 사용 가능 영역               |
| `NSWindow setFrame:display:` | 패널 위치 설정                             |

### 위치 계산 로직

```
1. 마우스 위치 획득 (NSEvent mouseLocation)
2. 화면 정보 획득 (NSScreen)
   - frame: 전체 화면 크기
   - visibleFrame: 메뉴바 제외 영역
3. Y 좌표 계산
   - visibleFrame 상단 (메뉴바 바로 아래) - 패널 높이
4. X 좌표 계산
   - 마우스 X - (패널 너비 / 2) → 중앙 정렬
   - 화면 좌/우 경계 벗어남 방지
5. 패널 프레임 적용
```

### 구현할 코드

#### `src-tauri/src/utils/macos.rs` 추가

```rust
/// 메뉴바 패널을 트레이 아이콘 아래에 위치시킨다.
pub fn position_menubar_panel(app_handle: &AppHandle, padding_top: f64) {
    let window = app_handle.get_webview_window("main").unwrap();
    let handle: id = window.ns_window().unwrap() as _;

    unsafe {
        // 마우스 위치 (트레이 아이콘 클릭 지점)
        let mouse_location: NSPoint = msg_send![class!(NSEvent), mouseLocation];

        // 화면 정보
        let screen: id = NSScreen::mainScreen(nil);
        let screen_frame: NSRect = NSScreen::frame(screen);
        let visible_frame: NSRect = msg_send![screen, visibleFrame];

        // 현재 윈도우 프레임
        let mut win_frame: NSRect = msg_send![handle, frame];

        // Y: 메뉴바 바로 아래
        win_frame.origin.y = visible_frame.origin.y + visible_frame.size.height
                             - win_frame.size.height - padding_top;

        // X: 마우스 기준 중앙, 화면 경계 처리
        let mut x = mouse_location.x - (win_frame.size.width / 2.0);
        x = x.max(screen_frame.origin.x);  // 왼쪽 경계
        x = x.min(screen_frame.origin.x + screen_frame.size.width - win_frame.size.width);  // 오른쪽 경계
        win_frame.origin.x = x;

        // 적용
        let _: () = msg_send![handle, setFrame: win_frame display: NO];
    }
}
```

#### `src-tauri/src/tray.rs` 수정

```rust
fn toggle_main_window(app_handle: &AppHandle) {
    use crate::utils::macos::position_menubar_panel;

    if let Ok(panel) = app_handle.get_webview_panel("main") {
        if panel.is_visible() {
            panel.order_out(None);
        } else {
            position_menubar_panel(app_handle, 0.0);  // ← 추가
            panel.show();
        }
        return;
    }
    // ... fallback
}
```

### 필요한 import 추가 (`utils/macos.rs`)

```rust
use tauri_nspanel::cocoa::{
    appkit::{NSMainMenuWindowLevel, NSScreen, NSView, NSWindow, NSWindowCollectionBehavior},
    base::{id, nil, NO},
    foundation::{NSPoint, NSRect},
};
```

---

## 멀티 모니터 고려사항

| 시나리오                    | 현재 전략 (P0)      | 향후 개선 (P1)     |
| --------------------------- | ------------------- | ------------------ |
| 싱글 모니터                 | ✅ 정상 동작        | -                  |
| 멀티 모니터 (메인에서 클릭) | ✅ 정상 동작        | -                  |
| 멀티 모니터 (보조에서 클릭) | ⚠️ 메인 모니터 기준 | 클릭한 모니터 감지 |

P0에서는 `NSScreen mainScreen` 사용. 트레이 아이콘이 보통 메인 모니터에 있어 대부분 정상 동작.

## UI 구성

### 2컬럼 레이아웃

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────┬─────────────────────┐ │
│  │                         │                     │ │
│  │   📅 2024년 1월 15일    │      ┌─────────┐   │ │
│  │                         │      │   ⚙️    │   │ │
│  │   성실한 뚱이            │      │  설정   │   │ │
│  │   @ 집게리아             │      └─────────┘   │ │
│  │                         │                     │ │
│  ├─────────────────────────┤                     │ │
│  │                         │                     │ │
│  │   💰 누적 금액           │                     │ │
│  │                         │                     │ │
│  │   ₩ 1,234,567          │                     │ │
│  │                         │                     │ │
│  │   25일부터 12일째        │                     │ │
│  │   벌고 있어요            │                     │ │
│  │                         │                     │ │
│  ├─────────────────────────┤                     │ │
│  │                         │                     │ │
│  │   🟢 근무중              │                     │ │
│  │   09:00 ~ 18:00         │                     │ │
│  │                         │                     │ │
│  └─────────────────────────┴─────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 레이아웃 사양

| 항목        | 값                  |
| ----------- | ------------------- |
| 패널 너비   | 320px               |
| 패널 높이   | 콘텐츠에 맞게 자동  |
| 왼쪽 영역   | 정보 표시 (~70%)    |
| 오른쪽 영역 | 메뉴 버튼 (~30%)    |
| 모서리      | border-radius: 12px |
| 배경        | 다크모드 고정       |

## 구현 내용

### 1. 메인 패널 컨테이너 (`src/features/menubar/menubar-panel.tsx`)

```typescript
import { useSalaryCalculator } from '~/hooks/use-salary-calculator';
import { useUserSettings } from '~/hooks/use-user-settings';
import { useUIStore } from '~/stores/ui-store';
import { InfoSection } from './info-section';
import { MenuSection } from './menu-section';
import { SettingsPanel } from '../settings/settings-panel';

export function MenubarPanel() {
  const { data: settings } = useUserSettings();
  const salaryInfo = useSalaryCalculator(settings ?? null);
  const showSettings = useUIStore((s) => s.showSettings);

  if (!settings?.onboardingCompleted || !salaryInfo) {
    return <OnboardingPrompt />;
  }

  // 설정 화면 표시
  if (showSettings) {
    return <SettingsPanel />;
  }

  // 메인 패널 표시
  return (
    <div className="flex w-80 rounded-xl bg-panel shadow-lg">
      {/* 왼쪽: 정보 표시 영역 */}
      <InfoSection settings={settings} salaryInfo={salaryInfo} />

      {/* 오른쪽: 메뉴 버튼 영역 */}
      <MenuSection />
    </div>
  );
}
```

### 2. 정보 표시 영역 (`src/features/menubar/info-section.tsx`)

```typescript
import type { UserSettings } from '~/lib/tauri-bindings';
import type { SalaryInfo } from '~/hooks/use-salary-calculator';
import { formatCurrency } from '~/lib/format';

interface Props {
  settings: UserSettings;
  salaryInfo: SalaryInfo;
}

export function InfoSection({ settings, salaryInfo }: Props) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const statusConfig = {
    working: { icon: '🟢', label: '근무중' },
    'not-working': { icon: '⚪', label: '근무종료' },
    'day-off': { icon: '🔵', label: '휴일' },
  };

  const status = statusConfig[salaryInfo.workStatus];

  return (
    <div className="flex flex-1 flex-col">
      {/* 헤더: 날짜 & 사용자 정보 */}
      <div className="border-b border-divider p-4">
        <p className="text-sm text-secondary">📅 {dateStr}</p>
        <p className="mt-1 font-medium">
          {settings.nickname}
          <span className="text-secondary"> @ </span>
          {settings.companyName}
        </p>
      </div>

      {/* 메인: 누적 금액 */}
      <div className="flex-1 p-4">
        <p className="text-sm text-secondary">💰 누적 금액</p>
        <p className="mt-2 text-3xl font-bold tabular-nums">
          {formatCurrency(salaryInfo.accumulatedEarnings)}
        </p>
        <p className="mt-2 text-sm text-secondary">
          {settings.payDay}일부터 {salaryInfo.workedDays + 1}일째
          {salaryInfo.workStatus === 'working' ? ' 벌고 있어요' : ''}
        </p>
      </div>

      {/* 푸터: 근무 상태 */}
      <div className="border-t border-divider p-4">
        <p className="font-medium">
          {status.icon} {status.label}
        </p>
        <p className="mt-1 text-sm text-secondary">09:00 ~ 18:00</p>
      </div>
    </div>
  );
}
```

### 3. 메뉴 버튼 영역 (`src/features/menubar/menu-section.tsx`)

```typescript
import { useUIStore } from '~/stores/ui-store';

export function MenuSection() {
  const setShowSettings = useUIStore((s) => s.setShowSettings);

  return (
    <div className="flex flex-col items-center justify-start border-l border-divider p-3">
      <button
        onClick={() => setShowSettings(true)}
        className="flex flex-col items-center gap-1 rounded-lg p-3 transition-colors hover:bg-hover"
      >
        <span className="text-2xl">⚙️</span>
        <span className="text-xs text-secondary">설정</span>
      </button>
    </div>
  );
}
```

### 4. UI 상태 스토어 (`src/stores/ui-store.ts`)

```typescript
import { create } from 'zustand';

interface UIState {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showSettings: false,
  setShowSettings: (show) => set({ showSettings: show }),
}));
```

### 5. 포맷 유틸리티 (`src/lib/format.ts`)

```typescript
/** 금액을 원화 형식으로 포맷 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(Math.floor(amount));
}
```

### 6. TanStack Query 훅 (`src/hooks/use-user-settings.ts`)

```typescript
import { useQuery } from '@tanstack/react-query';
import { commands, unwrapResult } from '~/lib/tauri-bindings';

export function useUserSettings() {
  return useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      return unwrapResult(await commands.loadUserSettings());
    },
  });
}
```

## 파일 구조

```
src/
├── features/
│   └── menubar/
│       ├── menubar-panel.tsx     # 메인 컨테이너
│       ├── info-section.tsx      # 왼쪽 정보 영역
│       └── menu-section.tsx      # 오른쪽 메뉴 영역
├── hooks/
│   ├── use-salary-calculator.ts
│   └── use-user-settings.ts
├── stores/
│   └── ui-store.ts
└── lib/
    └── format.ts
```

## 완료 조건

### Rust 백엔드

- [x] NSPanel 변환 (`swizzle_to_menubar_panel`)
- [x] 패널 이벤트 리스너 (포커스 해제 시 숨김)
- [x] 코너 라운딩 (13px)
- [x] 트레이 아이콘 클릭 핸들러
- [x] **패널 위치 지정 (`position_menubar_panel`)**

### React 프론트엔드

- [x] 2컬럼 레이아웃 패널 구현
- [x] 왼쪽 영역: 날짜/사용자 정보 헤더
- [x] 왼쪽 영역: 누적 금액 실시간 표시
- [x] 왼쪽 영역: 경과 일수 표시
- [x] 왼쪽 영역: 근무 상태 뱃지
- [x] 오른쪽 영역: 설정 버튼
- [x] UI 상태 스토어 (설정 화면 전환)
- [x] 다크모드 UI 스타일링
