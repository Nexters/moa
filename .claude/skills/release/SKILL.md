---
name: release
description: Prepare a new app release as a PR. Analyzes git history to determine semver bump, updates version files, runs checks, and opens a release PR. Merging the PR auto-builds (and auto-deploys for stable). Use when user says "release", "prepare release", "bump version", or "new version".
---

# Release

릴리스는 **main 직접 커밋이 아니라 PR**로 만든다. PR을 머지하면:

- main push가 `tauri.conf.json` 변경을 감지해 `build-app.yml`이 자동 실행된다.
- **베타(`-beta.N` 등 prerelease)**: 빌드 후 draft 릴리스로 남는다. 자동 업데이트는 나가지 않는다.
- **정식(`x.y.z`)**: 빌드 → 릴리스 노트 자동 생성 → draft 자동 publish → deploy(자동 업데이트 + Homebrew Cask + Discord)까지 자동 진행된다.

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

### 6. Create release branch and PR

Ask the user for confirmation, then create a branch, commit the version bump, and open a PR:

```bash
git checkout -b release/v<version>
git add .
git commit -m "chore: release v<version>"
git push -u origin release/v<version>
gh pr create \
  --base main \
  --title "chore: release v<version>" \
  --body "<릴리즈 노트>"
```

**릴리즈 노트(PR body) 작성**: `git log $(git describe --tags --abbrev=0)..HEAD --oneline` 결과를 바탕으로 다음 형식으로 직접 작성한다.

```markdown
## Release v<version>

### What's Changed
- <feat/fix 등 주요 변경 요약 (커밋/PR 기준)>

### 배포 영향
- (정식) 머지 시 자동 빌드 → 릴리스 노트 자동 생성 → 자동 publish → 전체 사용자 자동 업데이트
- (베타) 머지 시 빌드만, draft 유지 — 자동 업데이트 안 나감
```

prerelease 여부에 맞는 "배포 영향" 항목만 남긴다.

태그는 생성하지 않는다 — 머지 후 `build-app.yml`의 tauri-action이 `v<version>` 태그를 생성한다.

### 7. Inform the user

PR 생성 후 안내:

- PR을 **직접 머지**하면 빌드가 자동 시작된다 (자동 머지 안 함).
- 정식 릴리스: 머지하면 자동 publish + 배포까지 진행된다.
- 베타 릴리스: 머지해도 draft로 남는다. 사용자에게 내보내려면 https://github.com/nexters/moa/releases 에서 수동 publish.
