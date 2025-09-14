#!/usr/bin/env bash
set -euo pipefail

CLI_VERSION=""
REPO_VERSION=""
SHOULD_COMMIT=false
EXEC_DIR="executables"

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cli-version)
      CLI_VERSION="$2"
      shift 2
      ;;
    --repo-version)
      REPO_VERSION="$2"
      shift 2
      ;;
    --commit)
      SHOULD_COMMIT=true
      shift
      ;;
    *)
      echo "❌ Unknown option: $1"
      echo "Usage: $0 --cli-version <x.y.z> --repo-version <x.y.z> [--commit]"
      exit 1
      ;;
  esac
done

if [[ -z "$CLI_VERSION" || -z "$REPO_VERSION" ]]; then
  echo "❌ Error: both --cli-version and --repo-version are required."
  exit 1
fi

# Ensure required tools
for cmd in jq shasum pkg pnpm; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ Missing required tool: $cmd"
    exit 1
  fi
done

echo "🔨 Building CLI with pnpm..."
pnpm build:cli

mkdir -p "$EXEC_DIR"

########################################
# 1. Windows build for Scoop
########################################
echo "📦 Building Windows executable for Scoop..."
WIN_OUT="$EXEC_DIR/keyshade-cli.exe"
pkg apps/cli/dist/index.cjs \
  --targets node18-win-x64 \
  --output "$WIN_OUT"

WIN_HASH=$(shasum -a 256 "$WIN_OUT" | cut -d ' ' -f1)
WIN_URL="https://github.com/keyshade-xyz/keyshade/releases/download/v${REPO_VERSION}/keyshade-cli.exe"

echo "✅ Windows hash: $WIN_HASH"

########################################
# 2. Update package.json
########################################
echo "📝 Updating apps/cli/package.json..."
jq --arg version "$CLI_VERSION" '.version = $version' apps/cli/package.json > apps/cli/package.tmp.json
mv apps/cli/package.tmp.json apps/cli/package.json

########################################
# 3. Update Scoop manifest
########################################
echo "📝 Updating bucket/keyshade.json..."
jq \
  --arg version "$CLI_VERSION" \
  --arg url "$WIN_URL" \
  --arg hash "$WIN_HASH" \
  '.version = $version | .url = $url | .hash = $hash' \
  bucket/keyshade.json > bucket/keyshade.tmp.json
mv bucket/keyshade.tmp.json bucket/keyshade.json

########################################
# 4. Build macOS binaries for Homebrew
########################################
for arch in x64 arm64; do
  echo "📦 Building macOS $arch executable for Homebrew..."
  MAC_OUT="$EXEC_DIR/keyshade-cli-macos-${arch}"
  pkg apps/cli/dist/index.cjs \
    --targets "node18-macos-${arch}" \
    --output "$MAC_OUT"

  MAC_HASH=$(shasum -a 256 "$MAC_OUT" | cut -d ' ' -f1)
  MAC_URL="https://github.com/keyshade-xyz/keyshade/releases/download/v${REPO_VERSION}/keyshade-cli-macos-${arch}"

  echo "✅ macOS $arch hash: $MAC_HASH"

  # Update formula
  sed -i.bak \
    "s|sha256 \".*\" # ${arch}|sha256 \"$MAC_HASH\" # ${arch}|" \
    Formula/keyshade.rb
done

########################################
# 5. Cleanup
########################################
echo "🧹 Cleaning up executables..."
rm -rf "$EXEC_DIR"
rm Formula/keyshade.rb.bak

########################################
# 6. Commit changes
########################################
if [[ "$SHOULD_COMMIT" = true ]]; then
  echo "📦 Committing changes..."
  git add apps/cli/package.json bucket/keyshade.json Formula/keyshade.rb
  git commit -m "chore(cli): bumped version to v$CLI_VERSION"
fi

echo "✅ Done! CLI version bumped to $CLI_VERSION, repo version $REPO_VERSION"
