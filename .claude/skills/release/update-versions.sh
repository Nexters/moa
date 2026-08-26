#!/bin/bash
set -euo pipefail

VERSION="${1:?Usage: update-versions.sh <version> (e.g., 1.0.3)}"

# Strip 'v' prefix if present
VERSION="${VERSION#v}"

APP_PKG="apps/app/package.json"
CARGO_TOML="apps/app/src-tauri/Cargo.toml"
TAURI_CONF="apps/app/src-tauri/tauri.conf.json"
LOCKFILE="bun.lock"

echo "Updating versions to $VERSION..."

# Rewrite the quoted version literal on the first line matching `re`, leaving
# every other byte untouched, then assert the line really carries $VERSION.
#
# jq is deliberately not used for the JSON files: it reserializes the whole
# document, so it reflows lines the release never meant to touch (on v1.1.0 it
# expanded tauri.conf.json's `bundle.targets` onto four lines). BSD sed (macOS
# default) lacks GNU's `0,/re/` range, hence awk.
bump_version_line() {
  local file="$1" re="$2"

  awk -v v="$VERSION" -v re="$re" \
    '!hit && $0 ~ re { sub(/"[0-9][^"]*"/, "\"" v "\""); hit = 1 } { print }' \
    "$file" > "$file.tmp" && mv "$file.tmp" "$file"

  awk -v re="$re" '$0 ~ re { print; exit }' "$file" | grep -q "\"$VERSION\"" \
    || { echo "ERROR: failed to set version in $file" >&2; exit 1; }

  echo "  Updated $file"
}

# 1. apps/app/package.json
bump_version_line "$APP_PKG" '^  "version": "'

# 2. apps/app/src-tauri/Cargo.toml (the [package] version, which comes first)
bump_version_line "$CARGO_TOML" '^version = "'

# 3. apps/app/src-tauri/tauri.conf.json
bump_version_line "$TAURI_CONF" '^  "version": "'

# 4. bun.lock — `bun install` does not refresh a workspace's `version` field,
#    not even with --lockfile-only, so patch it directly. Anchored on the
#    package name because the root workspace entry carries no version field.
awk -v v="$VERSION" '
  /"name": "@moa\/app",/ { seen = 1 }
  seen && /"version": "/ { sub(/"[0-9][^"]*"/, "\"" v "\""); seen = 0 }
  { print }
' "$LOCKFILE" > "$LOCKFILE.tmp" && mv "$LOCKFILE.tmp" "$LOCKFILE"

awk '/"name": "@moa\/app",/ { seen = 1 } seen && /"version": "/ { print; exit }' "$LOCKFILE" \
  | grep -q "\"$VERSION\"" \
  || { echo "ERROR: failed to set @moa/app version in $LOCKFILE" >&2; exit 1; }

# Re-validate the dependency graph after the in-place edit.
bun install --silent
echo "  Updated $LOCKFILE"

echo "All version files updated to $VERSION"
