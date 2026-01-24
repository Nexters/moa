# Tauri App Guidelines

Defines rules, decision criteria, and workflows for the Moa Tauri app.
For code patterns and examples, see `docs/tauri-patterns.md`.

---

## 1. Tech Stack

| Layer    | Technology     | Version  |
| -------- | -------------- | -------- |
| Backend  | Tauri (Rust)   | **v2.x** |
| Frontend | React          | **19.x** |
| State    | Zustand        | **v5.x** |
| Data     | TanStack Query | **v5.x** |
| Styling  | Tailwind CSS   | **v4.x** |
| Build    | Vite           | **v7.x** |
| Runtime  | bun            | latest   |

---

## 2. Core Rules

### Mandatory Requirements

| Rule                         | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| **Tauri v2 only**            | Never use v1 docs/patterns                          |
| **Context7 first**           | Check Context7 before WebSearch for framework docs  |
| **Read files first**         | Always read file contents before modifying          |
| **Follow existing patterns** | Check codebase patterns before introducing new ones |
| **Use rm -f**                | Always use `-f` flag when deleting files            |

### Prohibited Actions

| Prohibited Action           | Reason                                       |
| --------------------------- | -------------------------------------------- |
| Running dev server directly | Ask user to run and report results           |
| Committing without request  | Only commit when explicitly requested        |
| Manual memoization          | React Compiler handles automatically         |
| Zustand destructuring       | Causes render cascade (detected by ast-grep) |

---

## 3. Decision Trees

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

## 4. Workflows

### Adding New Features

```
1. Plan    → Analyze requirements, identify impact scope
2. Rust    → Define backend commands/types
3. Binding → Run bun rust:bindings
4. React   → Implement frontend
5. Quality → Run bun check:all
```

### Adding Tauri Commands

1. **Define Rust command** - `src-tauri/src/commands/xxx.rs`
2. **Add specta::Type to types** - `#[derive(Type)]`
3. **Register in bindings.rs** - `collect_commands![]`
4. **Regenerate bindings** - `bun rust:bindings`
5. **Use in frontend** - `commands.xxx()`

> Detailed code examples: `docs/tauri-patterns.md` § "Tauri Command Pattern"

### Adding New Plugins

```bash
bun run tauri add PLUGIN_NAME
```

**Registration Order (Important):**

1. single-instance (must be first)
2. window-state
3. updater
4. others

### Quality Checks

```bash
# Full check (required before commit)
bun check:all

# Individual checks
bun lint         # oxlint
bun format       # oxfmt
cargo clippy     # Rust linter
cargo fmt        # Rust formatter
```

---

## 5. Code Writing Rules

### Zustand Usage Rules

| Situation                    | Correct Pattern                         | Prohibited Pattern               |
| ---------------------------- | --------------------------------------- | -------------------------------- |
| Subscribing to values        | `useStore((s) => s.value)`              | `const { value } = useStore()`   |
| Accessing state in callbacks | `useStore.getState().value`             | Closure over hook-derived values |
| Multiple values needed       | Individual selectors or shallow compare | Full destructuring               |

> Detailed code examples: `docs/tauri-patterns.md` § "State Management"

### Tauri Command Usage Rules

| Situation                  | Correct Pattern                      |
| -------------------------- | ------------------------------------ |
| Calling commands           | `commands.xxx()` (tauri-specta)      |
| Handling Result            | `if (result.status === 'ok')`        |
| TanStack Query integration | `unwrapResult(await commands.xxx())` |

> Detailed code examples: `docs/tauri-patterns.md` § "Tauri Command Pattern"

### Rust Code Rules

| Rule                   | Correct Example                   |
| ---------------------- | --------------------------------- |
| String formatting      | `format!("{variable}")` (modern)  |
| Error logging          | `log::error!("msg: {err:?}")`     |
| User error messages    | Korean, exclude technical details |
| Platform-specific code | `#[cfg(target_os = "macos")]`     |

### UI Component Rules

| Situation           | Correct Pattern                   |
| ------------------- | --------------------------------- |
| Stateful components | Use CSS visibility (`hidden`)     |
| Class composition   | Use `cn()` utility                |
| Semantic tokens     | `bg-bg-primary`, `text-text-high` |

> Detailed code examples: `docs/tauri-patterns.md` § "UI Patterns"

---

## 6. Pre-Commit Checklist

```
[ ] bun check:all passes
[ ] console.log removed
[ ] No hardcoded secrets
[ ] Error handling complete (try/catch, Result handling)
[ ] Related docs/ updated (if needed)
[ ] No Zustand destructuring
[ ] specta::Type derive added to new types
```

---

## 7. Anti-Patterns

| Anti-Pattern                     | Problem                | Correct Approach          |
| -------------------------------- | ---------------------- | ------------------------- |
| Zustand destructuring            | Render cascade         | Selector syntax           |
| `invoke('command')`              | No type safety         | `commands.xxx()`          |
| Manual `useMemo`/`useCallback`   | React Compiler handles | Just use normal functions |
| Conditional rendering (stateful) | State loss             | CSS visibility            |
| Tauri v1 patterns                | Incompatible with v2   | Reference v2 docs only    |

---

## 8. File Structure

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
    ├── hooks/               # Custom hooks
    ├── stores/              # Zustand stores
    ├── lib/                 # Utilities, bindings
    └── app.tsx              # Root component
```

---

## 9. Reference Documents

### Code Patterns

- `docs/tauri-patterns.md` - Code patterns, detailed examples

### Developer Docs

- `docs/bundle-optimization.md` - Bundle size management
- `docs/data-persistence.md` - Data storage strategy
- `docs/logging.md` - Rust and TypeScript logging
- `docs/releases.md` - Release process, auto-updates
- `docs/static-analysis.md` - Static analysis tools
