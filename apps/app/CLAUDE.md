# CLAUDE.md

**Moa App**: Real-time salary visualization menubar app (Tauri + React)

## Core Rules

1. **bun only** - Do not use `npm`/`pnpm`
2. **Korean responses** - Always respond in Korean
3. **Tauri v2 only** - Never use v1 docs/patterns
4. **Quality check** - Run `bun check:all` after changes

## Tech Stack

| Layer         | Technology     | Version |
| ------------- | -------------- | ------- |
| Backend       | Tauri (Rust)   | v2.x    |
| Frontend      | React          | 19.x    |
| State         | Zustand        | v5.x    |
| Data Fetching | TanStack Query | v5.x    |
| Styling       | Tailwind CSS   | v4.x    |
| Build         | Vite           | v7.x    |

## Quick Reference

```bash
bun dev:app        # Dev server (run in tmux)
bun build          # Production build
bun rust:bindings  # Regenerate TypeScript bindings
bun check:all      # Full quality check
```

## File Structure

```
apps/app/
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── lib.rs       # App setup, plugins
│   │   ├── bindings.rs  # tauri-specta registration
│   │   ├── types.rs     # Shared types
│   │   ├── tray.rs      # System tray
│   │   └── commands/    # Command handlers
│   └── Cargo.toml
├── src/                 # React frontend
│   ├── features/        # Feature components
│   ├── stores/          # Zustand stores
│   └── lib/             # Utilities, bindings
└── docs/                # Developer documentation
    ├── tauri-patterns.md    # Code patterns guide
    ├── data-persistence.md  # Storage patterns
    ├── releases.md          # Release process
    └── ...                  # Other guides
```

## Key Patterns (Summary)

### Tauri Commands

```typescript
import { commands, unwrapResult } from '~/lib/tauri-bindings';
const result = await commands.loadPreferences();
if (result.status === 'ok') {
  /* ... */
}
```

### Zustand Selector

```typescript
const value = useStore((s) => s.value); // Subscribes only to specific value
const { value } = useStore(); // Subscribes to entire store (avoid)
```

### getState() in Callbacks

```typescript
const handler = () => {
  const { value } = useStore.getState(); // No subscription
};
```

## Detailed Documentation

For comprehensive patterns and examples, see `docs/`:

| Document                 | Content                       |
| ------------------------ | ----------------------------- |
| `tauri-patterns.md`      | Full code patterns guide      |
| `data-persistence.md`    | File storage, atomic writes   |
| `releases.md`            | Release process, auto-updates |
| `static-analysis.md`     | oxlint, oxfmt, Rust tooling   |
| `logging.md`             | Rust and TypeScript logging   |
| `bundle-optimization.md` | Bundle size management        |
