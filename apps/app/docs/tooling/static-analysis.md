# Static Analysis

All static analysis tools configured in this app and how to use them.

## Quick Reference

| Tool           | Purpose               | Command                  | In check:all |
| -------------- | --------------------- | ------------------------ | ------------ |
| oxlint         | Linting + TypeScript  | `bun run lint`           | Yes          |
| oxfmt          | Code formatting       | `bun run format:check`   | Yes          |
| React Compiler | Automatic memoization | Build-time               | N/A          |
| cargo fmt      | Rust formatting       | `bun run rust:fmt:check` | Yes (app)    |
| clippy         | Rust linting          | `bun run rust:clippy`    | Yes (app)    |
| cargo test     | Rust tests            | `bun run rust:test`      | No           |

## Running All Checks

```bash
# Root workspace (JS/TS)
bun run check:all    # lint + format:check

# App workspace (Rust)
bun --filter @moa/app check:all  # rust:fmt:check + rust:clippy

# Both
bun run check:all && bun --filter @moa/app check:all
```

## Tool Details

### oxlint

Fast linter that handles syntax, style, and TypeScript-specific rules. Replaces ESLint with significantly faster performance.

```bash
bun run lint        # Check for issues
bun run lint:fix    # Auto-fix issues
```

**Configuration:** `.oxlintrc.json`

**Enabled plugins:**

- `eslint` - Core linting rules
- `typescript` - TypeScript-specific rules
- `unicorn` - Modern JS best practices
- `oxc` - Oxc-specific optimizations
- `react` - React-specific rules
- `vitest` - Test-specific rules

### oxfmt

Fast code formatter. Replaces Prettier with near-instant formatting.

```bash
bun run format:check   # Check formatting
bun run format         # Fix formatting
```

**Configuration:** `.oxfmtrc.json`

**Key features:**

- Tailwind CSS class sorting via `experimentalTailwindcss` (works with `clsx`, `cn` functions)
- Import sorting via `experimentalSortImports` (groups: builtin → external → internal → relative)
- Internal patterns: `@moa/`, `~/`

### React Compiler

Handles memoization automatically at build time via `babel-plugin-react-compiler`. You do **not** need to manually add:

- `useMemo` for computed values
- `useCallback` for function references
- `React.memo` for components

The compiler analyzes code and adds memoization where beneficial.

**Note:** The `getState()` pattern is still critical - it avoids store subscriptions, not memoization. See the State Management section in [tauri-patterns.md](./tauri-patterns.md).

### Rust Tooling

Located in `@moa/app` workspace.

```bash
bun --filter @moa/app rust:fmt:check   # Check formatting
bun --filter @moa/app rust:fmt         # Fix formatting
bun --filter @moa/app rust:clippy      # Lint with clippy
bun --filter @moa/app rust:clippy:fix  # Auto-fix clippy warnings
bun --filter @moa/app rust:test        # Run Rust tests
```

## Pre-commit Hook (lint-staged)

Automatic linting and formatting on staged files via `lint-staged`:

```json
{
  "*": ["bun lint:fix", "bun format"],
  "*.rs": ["bun --filter @moa/app rust:fmt:check"]
}
```

This runs automatically when committing files.

## CI Integration

`check:all` runs in CI. Ensure it passes locally before pushing:

```bash
bun run check:all
```

## Adding New Rules

**oxlint:** Modify `.oxlintrc.json` or enable additional plugins

**oxfmt:** Modify `.oxfmtrc.json` for formatting preferences
