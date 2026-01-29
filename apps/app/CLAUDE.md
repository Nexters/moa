# CLAUDE.md

**Moa App**: Real-time salary visualization menubar app (Tauri + React)

## Core Rules

1. **bun only** - Do not use `npm`/`pnpm`
2. **Korean responses** - Always respond in Korean
3. **Tauri v2 only** - Never use v1 docs/patterns
4. **Context7 first** - Check Context7 before WebSearch for framework docs
5. **Read files first** - Always read file contents before modifying
6. **Quality check** - Run `bun check:all` after changes

### Prohibited Actions

| Prohibited Action           | Reason                                       |
| --------------------------- | -------------------------------------------- |
| Running dev server directly | Ask user to run and report results           |
| Committing without request  | Only commit when explicitly requested        |
| Manual memoization          | React Compiler handles automatically         |
| Zustand destructuring       | Causes render cascade (detected by ast-grep) |

---

## Tech Stack

| Layer         | Technology     | Version |
| ------------- | -------------- | ------- |
| Backend       | Tauri (Rust)   | v2.x    |
| Frontend      | React          | 19.x    |
| State         | Zustand        | v5.x    |
| Data Fetching | TanStack Query | v5.x    |
| Styling       | Tailwind CSS   | v4.x    |
| Build         | Vite           | v7.x    |
| Runtime       | bun            | latest  |

---

## Decision Trees

### State Management Selection

```
Does data need to be shared across components?
├─ No → useState (component local)
└─ Yes → Does it need to persist across sessions?
         ├─ No → Zustand (global UI state)
         └─ Yes → TanStack Query + Tauri Command
```

### Data Storage Selection

```
What is the data characteristic?
├─ User settings (theme, language, salary info)
│   └─ Preferences (tauri-plugin-store)
│
├─ Temporary recovery data (crash recovery)
│   └─ Recovery (app data directory)
│
└─ Structured bulk data (history, statistics)
    └─ SQLite (tauri-plugin-sql)
```

### Rust Error Type Selection

```
Error complexity?
├─ Simple success/failure → Result<T, String>
└─ Multiple error types → Result<T, TypedEnum>
```

---

## Quick Reference

```bash
bun dev:app        # Dev server (run in tmux)
bun build          # Production build
bun rust:bindings  # Regenerate TypeScript bindings
bun check:all      # Full quality check
```

---

## File Structure

```
apps/app/
├── src-tauri/
│   └── src/
│       ├── main.rs          # Entry point
│       ├── lib.rs           # App setup, plugins
│       ├── bindings.rs      # tauri-specta registration
│       ├── types.rs         # Shared types
│       ├── tray.rs          # System tray
│       └── commands/        # Command handlers
│
└── src/
    ├── features/            # Feature-based components
    │   ├── menubar/
    │   ├── settings/
    │   └── onboarding/
    │   └── app.tsx          # Root component
    ├── hooks/               # Custom hooks
    ├── stores/              # Zustand stores
    ├── lib/                 # Utilities, bindings
```

---

## Key Patterns

### Tauri Command Pattern

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

### Adding New Tauri Commands

1. **Define Rust command** - `src-tauri/src/commands/xxx.rs`
2. **Add specta::Type to types** - `#[derive(Type)]`
3. **Register in bindings.rs** - `collect_commands![]`
4. **Regenerate bindings** - `bun rust:bindings`
5. **Use in frontend** - `commands.xxx()`

### Zustand Usage Rules

| Situation                    | Correct Pattern                         | Prohibited Pattern               |
| ---------------------------- | --------------------------------------- | -------------------------------- |
| Subscribing to values        | `useStore((s) => s.value)`              | `const { value } = useStore()`   |
| Accessing state in callbacks | `useStore.getState().value`             | Closure over hook-derived values |
| Multiple values needed       | Individual selectors or shallow compare | Full destructuring               |

```typescript
// ✅ GOOD: Selector syntax
const value = useStore((s) => s.value);

// ✅ GOOD: getState() in callbacks
const handler = () => {
  const { value } = useStore.getState();
};

// ❌ BAD: Destructuring (causes render cascade)
const { value } = useStore();
```

### CSS Visibility vs Conditional Rendering

For stateful components (react-resizable-panels, etc.):

```typescript
// ❌ BAD: State loss
{sidebarVisible ? <ResizablePanel /> : null}

// ✅ GOOD: Hide with CSS
<ResizablePanel className={sidebarVisible ? '' : 'hidden'} />
```

### UI Component Rules

| Situation           | Correct Pattern                   |
| ------------------- | --------------------------------- |
| Stateful components | Use CSS visibility (`hidden`)     |
| Class composition   | Use `cn()` utility                |
| Semantic tokens     | `bg-bg-primary`, `text-text-high` |

---

## Semantic Colors

Use semantic tokens instead of raw color values (e.g., `gray-70`, `green-40`).

### Background & Container

| Usage             | Semantic Token        |
| ----------------- | --------------------- |
| Background (main) | `bg-primary`          |
| Background (alt)  | `bg-secondary`        |
| Container (main)  | `container-primary`   |
| Container (alt)   | `container-secondary` |

### Text & Icon

| Usage           | Semantic Token  |
| --------------- | --------------- |
| Text (strong)   | `text-high`     |
| Text (medium)   | `text-medium`   |
| Text (weak)     | `text-low`      |
| Text (disabled) | `text-disabled` |

### Interactive States

| Usage        | Semantic Token       |
| ------------ | -------------------- |
| Hover state  | `interactive-hover`  |
| Active state | `interactive-active` |

### Status

| Usage   | Semantic Token |
| ------- | -------------- |
| Success | `success`      |
| Error   | `error`        |
| Info    | `info`         |

```tsx
// ✅ Good - Semantic Colors
<div className="bg-container-primary text-text-high hover:bg-interactive-hover">

// ❌ Bad - Raw tokens
<div className="bg-gray-80 text-white hover:bg-gray-70">
```

Token definitions: `packages/shared/src/styles/theme.css`

---

## Anti-Patterns

| Anti-Pattern                     | Problem                | Correct Approach          |
| -------------------------------- | ---------------------- | ------------------------- |
| Zustand destructuring            | Render cascade         | Selector syntax           |
| `invoke('command')`              | No type safety         | `commands.xxx()`          |
| Manual `useMemo`/`useCallback`   | React Compiler handles | Just use normal functions |
| Conditional rendering (stateful) | State loss             | CSS visibility            |
| Tauri v1 patterns                | Incompatible with v2   | Reference v2 docs only    |

---

## Pre-Commit Checklist

```
[ ] bun check:all passes
[ ] console.log removed
[ ] No hardcoded secrets
[ ] Error handling complete (try/catch, Result handling)
[ ] No Zustand destructuring
[ ] specta::Type derive added to new types
```

---

## Plugin Registration Order

When adding Tauri plugins, order matters:

1. **single-instance** - Must be first
2. **window-state**
3. **updater**
4. Others

---

## Advanced Documentation

For in-depth topics, see `docs/`:

| Document                          | Content                       |
| --------------------------------- | ----------------------------- |
| `advanced/data-persistence.md`    | File storage, atomic writes   |
| `advanced/releases.md`            | Release process, auto-updates |
| `advanced/bundle-optimization.md` | Bundle size management        |
| `tooling/static-analysis.md`      | oxlint, oxfmt, Rust tooling   |
| `tooling/logging.md`              | Rust and TypeScript logging   |
| `tooling/forms.md`                | TanStack Form patterns        |
