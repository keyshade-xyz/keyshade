#!/usr/bin/env bash
set -euo pipefail

CLI_VERSION=""
REPO_VERSION=""
SHOULD_COMMIT=false

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
      shift 1
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --cli-version <x.y.z> --repo-version <x.y.z> [--commit]"
      exit 1
      ;;
  esac
done

if [[ -z "$CLI_VERSION" || -z "$REPO_VERSION" ]]; then
  echo "Error: both --cli-version and --repo-version are required."
  exit 1
fi

# Ensure jq exists
if ! command -v jq &> /dev/null; then
  echo "jq not found. Please install jq."
  exit 1
fi

# Update apps/cli/package.json
jq --arg version "$CLI_VERSION" '.version = $version' apps/cli/package.json > apps/cli/package.tmp.json
mv apps/cli/package.tmp.json apps/cli/package.json

# Repo URL for Scoop manifest
URL="https://github.com/keyshade-xyz/keyshade/releases/download/v${REPO_VERSION}/keyshade-cli.exe"

# Compute hash
echo "Downloading from $URL"
HASH=$(curl -L "$URL" | shasum -a 256 | cut -d ' ' -f1)
echo "Computed hash for exe build: $HASH"

# Update Scoop manifest in place (only version, url, hash)
jq \
  --arg version "$CLI_VERSION" \
  --arg url "$URL" \
  --arg hash "$HASH" \
  '.version = $version
  | .url = $url
  | .hash = $hash' \
  bucket/keyshade.json > bucket/keyshade.tmp.json && mv bucket/keyshade.tmp.json bucket/keyshade.json


# Optionally commit changes
if [[ "$SHOULD_COMMIT" == true ]]; then
  git add apps/cli/package.json bucket/keyshade.json
  git commit -m "chore(cli): bumped version to v$CLI_VERSION"
  echo "✅ Committed bump: CLI version $CLI_VERSION, repo version $REPO_VERSION"
else
  echo "✅ Updated files (no commit): CLI version $CLI_VERSION, repo version $REPO_VERSION"
fi
