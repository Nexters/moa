# Moa Tauri Development Patterns

Development patterns guide for the Moa project. Tauri v2 + React 19 + Zustand v5 stack.

## 1. Architecture Overview

### Tech Stack

| Layer         | Technology     | Version |
| ------------- | -------------- | ------- |
| Backend       | Tauri (Rust)   | v2.x    |
| Frontend      | React          | 19.x    |
| State         | Zustand        | v5.x    |
| Data Fetching | TanStack Query | v5.x    |
| Styling       | Tailwind CSS   | v4.x    |
| Build         | Vite           | v7.x    |

### State Management Onion

```
┌─────────────────────────────────────┐
│           useState                  │  ← Component UI State
│  ┌─────────────────────────────────┐│
│  │          Zustand                ││  ← Global UI State
│  │  ┌─────────────────────────────┐││
│  │  │      TanStack Query         │││  ← Persistent Data
│  │  └─────────────────────────────┘││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Decision Criteria**: Data shared across components? → Persist across sessions?

### Event-Driven Bridge

- **Rust → React**: `app.emit("event-name", data)` → `listen("event-name", handler)`
- **React → Rust**: `commands.xxx()` (tauri-specta)

---

## 2. Tauri Command Pattern (tauri-specta)

### Basic Usage

```typescript
import { commands, type AppPreferences } from '~/lib/tauri-bindings';

// Result type handling
const result = await commands.loadPreferences();

if (result.status === 'ok') {
  console.log(result.data.theme); // Type-safe
} else {
  console.error(result.error);
}
```

### unwrapResult Pattern

When using with TanStack Query:

```typescript
import { commands, unwrapResult } from '~/lib/tauri-bindings';

const { data, error } = useQuery({
  queryKey: ['preferences'],
  queryFn: async () => unwrapResult(await commands.loadPreferences()),
});
```

### In Event Handlers

```typescript
const handleSave = async () => {
  const result = await commands.savePreferences(preferences);
  if (result.status === 'error') {
    toast.error('저장 실패', { description: result.error });
    return;
  }
  toast.success('저장 완료!');
};
```

### New Command Workflow

1. **Define Rust command** (`src-tauri/src/commands/xxx.rs`):

```rust
#[tauri::command]
#[specta::specta]
pub async fn my_command(arg: String) -> Result<MyType, String> {
    // implementation
}
```

2. **Add Type derive to types**:

```rust
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MyType {
    pub field: String,
}
```

3. **Register in bindings.rs**:

```rust
Builder::<tauri::Wry>::new().commands(collect_commands![
    crate::my_command,
])
```

4. **Regenerate TypeScript bindings**:

```bash
bun run rust:bindings
```

5. **Use in frontend**:

```typescript
import { commands, type MyType } from '~/lib/tauri-bindings';
const result = await commands.myCommand('arg');
```

---

## 3. Rust Architecture

### Module Structure

```
src-tauri/src/
├── main.rs          # Entry point
├── lib.rs           # App setup, plugins
├── bindings.rs      # tauri-specta registration
├── types.rs         # Shared types, validation
├── tray.rs          # System tray
├── commands/        # Command handlers by domain
│   ├── mod.rs
│   ├── menubar.rs
│   ├── preferences.rs
│   └── user_settings.rs
└── utils/
    ├── mod.rs
    ├── macos.rs     # macOS NSPanel
    └── platform.rs  # Platform helpers
```

### Naming Conventions

| Pattern       | Example                              |
| ------------- | ------------------------------------ |
| Command name  | `snake_case` (`load_preferences`)    |
| Error return  | `Result<T, String>` or typed enum    |
| String format | `format!("{variable}")`              |
| App handle    | `AppHandle` preferred (not `Window`) |

### Platform-Specific Code

```rust
#[cfg(target_os = "macos")]
fn macos_specific() { /* ... */ }

#[cfg(desktop)]
fn desktop_only() { /* ... */ }
```

### Error Types (for complex errors)

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum MyError {
    NotFound,
    ValidationError { message: String },
}
```

In TypeScript:

```typescript
if (error.type === 'ValidationError') {
  console.log(error.message);
}
```

---

## 4. State Management

### getState() Pattern (CRITICAL)

Access current state in callbacks without subscription:

```typescript
// ❌ BAD: Causes render cascade
const { currentFile, isDirty } = useEditorStore();
const handleSave = useCallback(() => {
  if (currentFile && isDirty) saveFile();
}, [currentFile, isDirty]); // Recreated every time!

// ✅ GOOD: Stable callback
const handleSave = useCallback(() => {
  const { currentFile, isDirty, saveFile } = useEditorStore.getState();
  if (currentFile && isDirty) saveFile();
}, []); // Empty dependencies
```

### Selector Syntax (No Destructuring)

```typescript
// ❌ BAD: Subscribes to entire store
const { currentFile } = useEditorStore();

// ✅ GOOD: Subscribes only to specific value
const currentFile = useEditorStore((state) => state.currentFile);

// ✅ GOOD: Derived selector
const hasCurrentFile = useEditorStore((state) => !!state.currentFile);
```

### CSS Visibility vs Conditional Rendering

For stateful components (react-resizable-panels, etc.):

```typescript
// ❌ BAD: State loss
{sidebarVisible ? <ResizablePanel /> : null}

// ✅ GOOD: Hide with CSS
<ResizablePanel className={sidebarVisible ? '' : 'hidden'} />
```

### React Compiler

Handles automatic memoization - manual `useMemo`/`useCallback`/`React.memo` unnecessary.
However, `getState()` pattern is still required (for subscription avoidance).

---

## 5. UI Patterns

### Tailwind v4 Structure

```css
@import 'tailwindcss';
@import '@moa/shared/theme.css'; /* Shared design tokens */

@theme {
  --color-bg-primary: var(--color-gray-90);
  --color-text-high: var(--color-gray-0);
}
```

### Semantic Color Tokens

| Category   | Tokens                          | Usage             |
| ---------- | ------------------------------- | ----------------- |
| Background | `bg-primary`, `bg-secondary`    | Page background   |
| Container  | `container-primary/secondary`   | Cards, panels     |
| Text       | `text-high/medium/low/disabled` | Text hierarchy    |
| Status     | `error`, `success`, `info`      | Status indicators |

```tsx
<div className="bg-bg-primary text-text-high">content</div>
```

### Desktop-Only Styles

```css
body {
  user-select: none; /* Disable default selection */
  overscroll-behavior: none; /* Prevent bounce */
  overflow: hidden; /* Prevent body scroll */
}

* {
  cursor: default;
} /* Default arrow cursor */

input,
textarea {
  user-select: text !important;
  cursor: text !important;
}
```

### cn() Utility

```tsx
import { cn } from '~/lib/utils';

<div className={cn('base-styles', disabled && 'opacity-50', className)} />;
```

### Typography Scale

| Utility       | Size | Usage   |
| ------------- | ---- | ------- |
| `text-h1-700` | 40px | Hero    |
| `text-t1-500` | 24px | Title   |
| `text-b1-400` | 16px | Body    |
| `text-c1-500` | 12px | Caption |

Weight: `700` (Bold), `600` (Semibold), `500` (Medium), `400` (Regular)

---

## 6. Error Handling

### Rust Error Pattern

```rust
// Separate technical log + user message
log::error!("Database error: {err:?}");
Err("데이터를 저장할 수 없습니다".to_string())
```

### TypeScript Error Pattern

```typescript
// Separate toast (user) + logger (developer)
const result = await commands.saveData(data);
if (result.status === 'error') {
  console.error('Save failed:', result.error);
  toast.error('저장 실패');
  return;
}
```

### Rollback Pattern

```typescript
const original = structuredClone(currentState);
try {
  await riskyOperation();
} catch (error) {
  setState(original); // Rollback
  throw error;
}
```

---

## 7. Tauri Plugins

### Installed Plugins

| Plugin                | Purpose                    | Frontend Package                       |
| --------------------- | -------------------------- | -------------------------------------- |
| **single-instance**   | Prevent multiple instances | -                                      |
| **window-state**      | Save window state          | `@tauri-apps/plugin-window-state`      |
| **fs**                | File system                | `@tauri-apps/plugin-fs`                |
| **dialog**            | Native dialogs             | `@tauri-apps/plugin-dialog`            |
| **notification**      | System notifications       | `@tauri-apps/plugin-notification`      |
| **clipboard-manager** | Clipboard                  | `@tauri-apps/plugin-clipboard-manager` |
| **updater**           | App updates                | `@tauri-apps/plugin-updater`           |
| **tauri-nspanel**     | macOS panel                | -                                      |

### Registration Order (CRITICAL)

1. **single-instance** - Must be first
2. **window-state**
3. **updater**
4. Others

### Adding New Plugins

```bash
bun run tauri add PLUGIN_NAME
```

---

## 8. Quality Gates

### Full Check

```bash
bun check:all
```

### Individual Checks

| Command        | Tool           |
| -------------- | -------------- |
| `bun lint`     | oxlint         |
| `bun format`   | oxfmt          |
| `cargo clippy` | Rust linter    |
| `cargo fmt`    | Rust formatter |

### Recommended File Structure

```
src/
├── features/           # Feature-based components
│   ├── menubar/
│   ├── settings/
│   └── onboarding/
├── hooks/              # Custom hooks
├── stores/             # Zustand stores
├── lib/                # Utilities, bindings
├── app.tsx             # Root component
└── app.css             # Styles (import shared theme)
```

---

## Quick Reference

### Common Commands

```bash
bun dev:app          # Dev server (run in tmux)
bun build            # Production build
bun rust:bindings    # Regenerate TypeScript bindings
bun check:all        # Full quality check
```

### Common Patterns

```typescript
// Zustand selector
const value = useStore((s) => s.value);

// State in callback
const handler = () => {
  const { value } = useStore.getState();
};

// Tauri command
const result = await commands.xxx();
if (result.status === 'ok') {
  /* ... */
}

// TanStack Query + Tauri
const { data } = useQuery({
  queryKey: ['key'],
  queryFn: async () => unwrapResult(await commands.xxx()),
});
```

---

## 9. Multi-Window Architecture

Tauri applications can have multiple windows, each running a separate JavaScript context. Windows cannot share React state directly.

**Key patterns:**

1. **Separate entry points** - Each window has its own HTML file and React root
2. **Event-based communication** - Use Tauri events to communicate between windows
3. **Window reuse** - Create windows once at startup, then show/hide as needed
4. **Theme synchronization** - Emit theme changes so all windows stay in sync

```typescript
// Window A: emit event
await emit('data-updated', { value: 'new data' });

// Window B: listen and react
listen('data-updated', ({ payload }) => {
  setData(payload.value);
});
```

---

## 10. Security Architecture

### Tauri Capabilities

Tauri v2 uses a permission-based capabilities system. Each window only gets the permissions it needs.

**Location:** `src-tauri/capabilities/default.json`

```json
{
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": ["core:window:allow-minimize", "fs:default"]
}
```

**Key rules:**

- Use specific window labels, not `["*"]`
- Only add permissions actually needed
- Remote content (if any) should have minimal permissions

### Content Security Policy

CSP prevents XSS attacks. Configuration is in `src-tauri/tauri.conf.json`.

**Rules:**

- Never load scripts from CDNs - bundle everything locally
- Avoid `'unsafe-eval'` unless absolutely necessary
- Images: restrict to specific domains when possible

### Secure Storage

| Data Type       | Storage                       | Security Level |
| --------------- | ----------------------------- | -------------- |
| API tokens/keys | OS keychain (`keyring` crate) | High           |
| App preferences | App data directory (JSON)     | Medium         |
| User content    | App data directory/SQLite     | Medium         |

Never store sensitive tokens in `tauri-plugin-store` (plain JSON on disk). Use OS keychain (`keyring` crate) for sensitive credentials.

### Rust-First Security

All file operations happen in Rust with built-in validation:

```rust
fn is_blocked_directory(path: &Path) -> bool {
    let blocked_patterns = ["/System/", "/usr/", "/etc/", "/.ssh/"];
    blocked_patterns.iter().any(|pattern| path.starts_with(pattern))
}
```

### Input Sanitization

```rust
pub fn sanitize_filename(filename: &str) -> String {
    filename.chars()
        .filter(|c| !['/', '\\', ':', '*', '?', '"', '<', '>', '|'].contains(c))
        .collect()
}
```

---

## 11. Anti-Patterns to Avoid

| Anti-Pattern                    | Why It's Bad                        | Do This Instead               |
| ------------------------------- | ----------------------------------- | ----------------------------- |
| State in wrong layer            | Confuses ownership, breaks patterns | Follow the onion model        |
| Direct Rust-React coupling      | Tight coupling, hard to maintain    | Use command system and events |
| Store subscription in callbacks | Causes render cascades              | Use `getState()` pattern      |
| Skipping input validation       | Security vulnerabilities            | Always validate in Rust       |
| Magic/implicit patterns         | Hard for AI and humans to follow    | Prefer explicit, clear code   |
