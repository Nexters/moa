# Moa App

Tauri menubar app: real-time salary visualization (Tauri + React)

## Core Rules

1. **Tauri v2 only** - Never use v1 docs/patterns

## Prohibited Actions

| Action                      | Reason                                       |
| --------------------------- | -------------------------------------------- |
| Running dev server directly | Ask user to run and report results           |
| Manual memoization          | React Compiler handles automatically         |
| Zustand destructuring       | Causes render cascade (detected by ast-grep) |

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

## Quick Reference

```bash
bun dev:app        # Dev server (in tmux)
bun build          # Production build
bun rust:bindings  # Regenerate TS bindings
bun check:all      # Full quality check
```

## File Structure

```
apps/app/
├── src-tauri/
│   └── src/
│       ├── main.rs          # Entry point
│       ├── lib.rs           # App setup, plugins
│       ├── bindings.rs      # tauri-specta registration
│       ├── types.rs         # Shared types
│       ├── tray.rs          # System tray icon/animation + icon theme setting
│       ├── salary.rs        # Salary calculation (single source of truth) + background ticker
│       └── commands/        # Command handlers
│
└── src/
    ├── features/            # Feature-based components
    │   ├── home/
    │   ├── confetti/        # 월급날 축하 (오버레이 + confetti 윈도우)
    │   ├── settings/
    │   ├── onboarding/
    │   └── app.tsx          # Root component
    ├── hooks/               # Custom hooks (useSalaryTick: Rust 이벤트 구독)
    ├── stores/              # Zustand stores
    ├── lib/                 # Utilities, bindings
```

## Plugin Registration Order

When adding Tauri plugins, order matters:

1. **single-instance** - Must be first
2. **window-state**
3. **updater**
4. Others

## Documentation

For in-depth topics, see `docs/`:

| Document                          | Content                       |
| --------------------------------- | ----------------------------- |
| `patterns/tauri.md`               | Tauri command patterns        |
| `patterns/zustand.md`             | Zustand usage rules           |
| `patterns/ui.md`                  | UI, CSS, semantic colors      |
| `tooling/static-analysis.md`      | oxlint, oxfmt, Rust tooling   |
| `tooling/logging.md`              | Rust and TypeScript logging   |
| `tooling/forms.md`                | TanStack Form patterns        |
| `advanced/autostart.md`           | Login items, system settings  |
| `advanced/data-persistence.md`    | File storage, atomic writes   |
| `advanced/releases.md`            | Release process, auto-updates |
| `advanced/bundle-optimization.md` | Bundle size management        |
