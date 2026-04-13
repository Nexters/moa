---
name: release
description: Prepare and publish a new app release. Analyzes git history to determine semver bump, updates version files, runs checks, and commits/tags/pushes. Use when user says "release", "prepare release", "bump version", or "new version".
---

# Release

## Workflow

### 1. Sync to latest main

```bash
git checkout main
git pull origin main
```

Working directory must be clean. Abort if uncommitted changes exist.

### 2. Determine version

Read current version from `apps/app/package.json`.

Analyze commits since last tag:

```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

Apply conventional commits rules:

- `BREAKING CHANGE` or `!:` in any commit → **major** bump
- Any `feat:` or `feat(…):` → **minor** bump
- Otherwise (`fix:`, `perf:`, `refactor:`, `chore:`, etc.) → **patch** bump

Present the recommended version and commit summary to the user. Wait for confirmation before proceeding. The user may override with a different version.

### 3. Quality checks

```bash
bun check:all
bun --filter @moa/app check:all
```

Abort on failure.

### 4. Update version files

Run from project root:

```bash
bash .claude/skills/release/update-versions.sh <clean_version>
```

This updates 4 files:

- `apps/app/package.json`
- `apps/app/src-tauri/Cargo.toml`
- `apps/app/src-tauri/tauri.conf.json`
- `bun.lock` (via `bun install`)

### 5. Rust compilation check

```bash
cd apps/app/src-tauri && cargo check
```

### 6. Commit, tag, push

Ask the user for confirmation, then:

```bash
git add .
git commit -m "chore: release v<version>"
git tag v<version>
git push origin main --tags
```

After push, inform:

- GitHub Actions will build the release automatically
- Draft release will appear at https://github.com/nexters/moa/releases
- User must manually publish the draft release
