# Moa

Monorepo: real-time salary visualization menubar app

## Core Rules

1. **bun only** - Do not use `npm`/`pnpm`
2. **Korean responses** - Always respond in Korean
3. **Quality check** - Run `bun check:all` after changes

## Apps

| App         | Description         | Location        |
| ----------- | ------------------- | --------------- |
| **app**     | Tauri menubar app   | `apps/app/`     |
| **landing** | Static landing page | `apps/landing/` |

## Quick Reference

```bash
bun dev:app        # Tauri app (in tmux)
bun dev:landing    # Landing page
bun check:all      # Full quality check
```
