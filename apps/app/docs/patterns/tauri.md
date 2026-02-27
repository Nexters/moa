# Tauri Command Patterns

## Calling Commands

```typescript
import { commands, unwrapResult } from '~/lib/tauri-bindings';

// Basic usage
const result = await commands.loadPreferences();
if (result.status === 'ok') {
  console.log(result.data.theme);
} else {
  console.error(result.error);
}

// With TanStack Query
const { data } = useQuery({
  queryKey: ['preferences'],
  queryFn: async () => unwrapResult(await commands.loadPreferences()),
});
```

## Adding New Commands

1. **Define Rust command** - `src-tauri/src/commands/xxx.rs`
2. **Add specta::Type to types** - `#[derive(Type)]`
3. **Register in bindings.rs** - `collect_commands![]`
4. **Regenerate bindings** - `bun rust:bindings`
5. **Use in frontend** - `commands.xxx()`

## Background Tasks with Events

Webview가 비활성화되어도 동작해야 하는 로직은 Rust 백그라운드 스레드로 구현한다.

### Pattern: Rust 타이머 + Event Emit

```rust
// 1. 변경 알림용 AtomicBool
static SETTINGS_CHANGED: AtomicBool = AtomicBool::new(false);

#[tauri::command]
#[specta::specta]
pub fn notify_settings_changed() {
    SETTINGS_CHANGED.store(true, Ordering::Relaxed);
}

// 2. 백그라운드 스레드 (lib.rs setup에서 호출)
pub fn start_ticker(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let mut state = load_from_disk(&app_handle);
        loop {
            if SETTINGS_CHANGED.swap(false, Ordering::Relaxed) {
                state = load_from_disk(&app_handle);
            }
            // 계산 → 네이티브 API 직접 호출 → 이벤트 emit
            let _ = app_handle.emit("event-name", &payload);
            std::thread::sleep(Duration::from_secs(1)); // sleep은 loop 끝에 배치
        }
    });
}
```

### React에서 이벤트 수신

```typescript
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten = listen<Payload>('event-name', (event) => {
    setData(event.payload);
  });
  return () => {
    void unlisten.then((fn) => fn());
  };
}, []);
```

### 설정 변경 시 알림

설정/데이터 저장 후 `commands.notifySettingsChanged()`를 호출하여 Rust 스레드에 변경을 알린다.

**현재 사용처**: `salary.rs` — 급여 계산의 single source of truth. 메뉴바 타이틀을 직접 갱신하고, `salary-tick` 이벤트로 React UI(`useSalaryTick` 훅)에도 동일한 계산 결과를 전달한다 (1초 간격).

**Overnight shift 정책**: 근무 종료 시간이 시작 시간 이하인 경우(예: 18:00–00:00, 22:00–06:00) 자정 넘김으로 처리한다. `work_end_minutes`에 +1440(24h)을 더하고, 자정 이후의 `current_minutes`에도 동일하게 +1440을 더해 단일 타임라인으로 정규화한다.

## 별도 윈도우 (Multi-Window)

메인 패널과 독립적으로 OS 레이어에 표시해야 하는 UI는 별도 Tauri 윈도우로 구현한다.

### Pattern: Confetti 윈도우

```
CelebrateButton 클릭
├─ React 오버레이 (패널 내부, fixed z-50)
│   └─ payday-overlay.tsx — blur 배경 + 월급 표시, 3초 후 fade-out
└─ Tauri 윈도우 (OS 레이어, 메인 윈도우 위)
    └─ confetti.ts — canvas-confetti 발사 후 자동 destroy
```

**Rust 측** (`commands/confetti.rs`):

- `WebviewWindowBuilder`로 모니터 전체 크기 투명 윈도우 생성
- `transparent(true)`, `decorations(false)`, `always_on_top(true)`
- `set_ignore_cursor_events(true)` — 마우스 클릭 통과
- 타임스탬프 기반 label(`confetti-{ts}`)로 중첩 생성 가능

**Frontend 측** (`confetti.html` → `confetti.ts`):

- React 앱과 완전 분리된 별도 HTML 진입점
- Vite `build.rollupOptions.input`에 등록 필요
- `capabilities/default.json`의 `windows`에 와일드카드 패턴 등록: `"confetti-*"`

### 새 윈도우 추가 시 체크리스트

1. Rust command에서 `WebviewWindowBuilder` 생성
2. 별도 HTML 진입점 + TS 스크립트 작성
3. `vite.config.ts`의 `rollupOptions.input`에 추가
4. `capabilities/default.json`의 `windows`에 label 패턴 추가
5. `bindings.rs`에 command 등록 → `bun rust:bindings`
