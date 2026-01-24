# CLAUDE.md

**Moa**: Monorepo for Moa project

## Core Rules

1. **bun only** - Do not use `npm`/`pnpm`
2. **Korean responses** - Always respond in Korean
3. **Quality check** - Run `bun check:all` after changes

## Apps

| App         | Description         | Location        |
| ----------- | ------------------- | --------------- |
| **app**     | Tauri menubar app   | `apps/app/`     |
| **landing** | Static landing page | `apps/landing/` |

## Detailed Guides

| Document             | Content                        |
| -------------------- | ------------------------------ |
| `apps/app/docs/`     | Tauri app development patterns |
| `apps/app/CLAUDE.md` | App-specific instructions      |

## Quick Reference

```bash
bun dev:app        # Run Tauri app (in tmux)
bun dev:landing    # Run landing page
bun check:all      # Full quality check
```
