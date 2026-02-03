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

## App-Specific Instructions

See `apps/app/CLAUDE.md` for comprehensive Tauri app development guidelines.

## Branch Naming

- `feature/<description>` - 새 기능
- `fix/<description>` - 버그 수정
- `refactor/<description>` - 리팩토링

## Quick Reference

```bash
bun dev:app        # Run Tauri app (in tmux)
bun dev:landing    # Run landing page
bun check:all      # Full quality check
```
