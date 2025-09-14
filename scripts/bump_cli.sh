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
echo "Downloading Windows executable from $URL"
HASH=$(curl -L "$URL" | shasum -a 256 | cut -d ' ' -f1)
echo "Computed hash for Windows executable: $HASH"

# Update Scoop manifest in place (only version, url, hash)
jq \
  --arg version "$CLI_VERSION" \
  --arg url "$URL" \
  --arg hash "$HASH" \
  '.version = $version
  | .url = $url
  | .hash = $hash' \
  bucket/keyshade.json > bucket/keyshade.tmp.json && mv bucket/keyshade.tmp.json bucket/keyshade.json

# Brew formula update
BREW_FORMULA="Formula/keyshade.rb"
INTEL_URL="https://github.com/keyshade-xyz/keyshade/releases/download/v${REPO_VERSION}/keyshade-cli-macos-x64"
ARM_URL="https://github.com/keyshade-xyz/keyshade/releases/download/v${REPO_VERSION}/keyshade-cli-macos-arm64"

echo "Downloading MacOS(x64) executable from $INTEL_URL"
INTEL_HASH=$(curl -L "$INTEL_URL" | shasum -a 256 | cut -d ' ' -f1)
echo "Computed hash for MacOS(x64) executable: $HASH"

echo "Downloading MacOS(arm64) executable from $ARM_URL"
ARM_HASH=$(curl -L "$ARM_URL" | shasum -a 256 | cut -d ' ' -f1)
echo "Computed hash for MacOS(arm64) executable: $ARM_HASH"

cat > "$BREW_FORMULA" <<EOF
class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.xyz"
  version "$CLI_VERSION"
  license "MIT"

  on_macos do
    on_intel do
      url "$INTEL_URL"
      sha256 "$INTEL_HASH"
    end

    on_arm do
      url "$ARM_URL"
      sha256 "$ARM_HASH"
    end
  end

  def install
    bin.install "keyshade-cli" => "keyshade"
  end
end
EOF


# Optionally commit changes
if [[ "$SHOULD_COMMIT" == true ]]; then
  git add apps/cli/package.json bucket/keyshade.json
  git commit -m "chore(cli): bumped version to v$CLI_VERSION"
  echo "✅ Committed bump: CLI version $CLI_VERSION, repo version $REPO_VERSION"
else
  echo "✅ Updated files (no commit): CLI version $CLI_VERSION, repo version $REPO_VERSION"
fi
