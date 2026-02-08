# Releases

Release process, version management, and auto-update system.

## Overview

The release system provides:

- Automated GitHub Actions workflow for building releases
- Version management script for updating all version files
- Auto-updater for seamless user updates
- Cross-platform builds (macOS, Windows, Linux)

## Initial Setup

### 1. Generate Signing Keys

```bash
npm install -g @tauri-apps/cli
tauri signer generate -w ~/.tauri/myapp.key
# Outputs private key (saved) and public key (displayed)
```

### 2. Configure GitHub Repository

Add these secrets (Settings → Secrets and variables → Actions):

- `TAURI_PRIVATE_KEY`: Content of `~/.tauri/myapp.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Password you set (if any)

### 3. Update Configuration

**`src-tauri/tauri.conf.json`:**

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
      ],
      "dialog": false,
      "pubkey": "YOUR_PUBLIC_KEY_FROM_STEP_1"
    }
  }
}
```

**Bundle info in `tauri.conf.json`:**

- Update `publisher`, `shortDescription`, `longDescription`
- Update `productName` and `identifier`

### 4. macOS Code Signing & Notarization

Apple Developer Program ($99/yr) 가입 후 설정.

**인증서 발급:**

1. Apple Developer → Certificates → Developer ID Application 생성
2. Keychain Access에서 .p12 내보내기

**App Store Connect API 키 생성:**

1. App Store Connect → 사용자 및 액세스 → 통합 → App Store Connect API
2. 키 생성 (앱 관리 권한), .p8 파일 다운로드

**GitHub Secrets 추가:**

| Secret                       | Description                           |
| ---------------------------- | ------------------------------------- |
| `APPLE_CERTIFICATE`          | Base64 encoded .p12 certificate       |
| `APPLE_CERTIFICATE_PASSWORD` | .p12 export password                  |
| `KEYCHAIN_PASSWORD`          | Arbitrary string for CI keychain      |
| `APPLE_SIGNING_IDENTITY`     | `Developer ID Application: Name (ID)` |
| `APPLE_API_ISSUER`           | App Store Connect Issuer ID           |
| `APPLE_API_KEY`              | App Store Connect Key ID              |
| `APPLE_API_KEY_CONTENT`      | .p8 file content                      |

**검증:**

```bash
# 코드 서명 확인
codesign -dv --verbose=4 /path/to/moa.app

# 공증 확인
spctl -a -vv /path/to/moa.app
```

## Release Process

### Simple Method

```bash
bun run release:prepare v1.0.0
```

This will:

1. Check git status is clean
2. Run all quality checks (`bun run check:all`)
3. Update versions in `package.json`, `Cargo.toml`, `tauri.conf.json`
4. Ask if you want to commit and push

Then GitHub Actions will:

1. Build the app for all platforms
2. Create a draft release
3. Generate `latest.json` for auto-updates
4. Upload all installers and signatures

Finally, manually publish the draft release on GitHub.

### Manual Method

```bash
# Update versions in package.json, Cargo.toml, tauri.conf.json
bun run check:all
git add .
git commit -m "chore: release v1.0.0"
git tag v1.0.0
git push origin main --tags
```

## Version Strategy

Semantic versioning (`v1.0.0`):

- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features, backwards compatible
- **Patch** (x.x.1): Bug fixes

All three files must have matching versions:

- `package.json` → `"version": "1.0.0"`
- `src-tauri/Cargo.toml` → `version = "1.0.0"`
- `src-tauri/tauri.conf.json` → `"version": "1.0.0"`

## Auto-Update System

### Behavior

- Checks for updates 5 seconds after app launch
- Shows confirmation dialog when update is available
- Downloads and installs in background
- Offers to restart when complete
- Fails silently on network issues

### Update Flow

```
App Launch → (5s delay) → Check GitHub → Show Dialog → Download → Install → Restart
```

### Implementation

```typescript
// app.tsx
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

useEffect(() => {
  const checkForUpdates = async () => {
    try {
      const update = await check();
      if (update) {
        const shouldUpdate = confirm(`Update available: ${update.version}...`);
        if (shouldUpdate) {
          await update.downloadAndInstall();
          if (confirm('Restart to apply update?')) {
            await relaunch();
          }
        }
      }
    } catch {
      // Silent fail - don't bother user with network issues
    }
  };

  const timer = setTimeout(checkForUpdates, 5000);
  return () => clearTimeout(timer);
}, []);
```

### Manual Update Check

Users can manually check via:

- **Menu**: App → Check for Updates

## Release Artifacts

Each release creates:

- **macOS**: `.dmg` installer
- **Windows**: `.msi` installer (when configured)
- **Linux**: `.deb` and `.AppImage` (when configured)
- **Auto-updater**: `latest.json` manifest and `.sig` signature files

## Security

All updates are cryptographically signed:

1. Private key signs releases during build
2. Public key in config verifies downloads
3. Invalid signatures are automatically rejected

## Troubleshooting

| Issue                    | Solution                                              |
| ------------------------ | ----------------------------------------------------- |
| Workflow doesn't trigger | Ensure tag starts with `v` and is pushed              |
| Build fails              | Check GitHub secrets, run `bun run check:all` locally |
| Updates not detected     | Verify endpoint URL and public key match              |
| Download fails           | Check signatures, file permissions, disk space        |
