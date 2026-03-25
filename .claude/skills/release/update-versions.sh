#!/bin/bash
set -euo pipefail

VERSION="${1:?Usage: update-versions.sh <version> (e.g., 1.0.3)}"

# Strip 'v' prefix if present
VERSION="${VERSION#v}"

APP_PKG="apps/app/package.json"
CARGO_TOML="apps/app/src-tauri/Cargo.toml"
TAURI_CONF="apps/app/src-tauri/tauri.conf.json"

echo "Updating versions to $VERSION..."

# 1. apps/app/package.json
jq --arg v "$VERSION" '.version = $v' "$APP_PKG" > tmp.json && mv tmp.json "$APP_PKG"
echo "  Updated $APP_PKG"

# 2. apps/app/src-tauri/Cargo.toml (first version = line only)
sed -i '' "0,/^version = \"[^\"]*\"/s/version = \"[^\"]*\"/version = \"$VERSION\"/" "$CARGO_TOML"
echo "  Updated $CARGO_TOML"

# 3. apps/app/src-tauri/tauri.conf.json
jq --arg v "$VERSION" '.version = $v' "$TAURI_CONF" > tmp.json && mv tmp.json "$TAURI_CONF"
echo "  Updated $TAURI_CONF"

# 4. Lock file
bun install --silent
echo "  Updated bun.lock"

echo "All version files updated to $VERSION"
