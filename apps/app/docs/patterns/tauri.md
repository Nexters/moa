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
  return () => { void unlisten.then(fn => fn()); };
}, []);
```

### 설정 변경 시 알림

설정/데이터 저장 후 `commands.notifySettingsChanged()`를 호출하여 Rust 스레드에 변경을 알린다.

**현재 사용처**: `salary.rs` — 급여 계산의 single source of truth. 메뉴바 타이틀을 직접 갱신하고, `salary-tick` 이벤트로 React UI(`useSalaryTick` 훅)에도 동일한 계산 결과를 전달한다 (1초 간격).
