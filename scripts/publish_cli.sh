#!/usr/bin/env bash
set -euo pipefail

SHOULD_COMMIT=false
EXEC_DIR="executables"

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --commit)
      SHOULD_COMMIT=true
      shift
      ;;
    *)
      echo "❌ Unknown option: $1"
      echo "Usage: $0 [--commit]"
      exit 1
      ;;
  esac
done

# Read versions from package.json
CLI_VERSION=$(jq -r '.version' apps/cli/package.json)
REPO_VERSION=$(jq -r '.version' package.json)

echo "📌 CLI version: $CLI_VERSION"
echo "📌 Repo version: $REPO_VERSION"

# Ensure required tools
for cmd in jq shasum curl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ Missing required tool: $cmd"
    exit 1
  fi
done

mkdir -p "$EXEC_DIR"

########################################
# 1. Windows build for Scoop (download)
########################################
echo "📥 Downloading Windows executable for Scoop..."
WIN_OUT="$EXEC_DIR/keyshade-cli.exe"
WIN_URL="https://github.com/keyshade-xyz/keyshade/releases/download/v${REPO_VERSION}/keyshade-cli.exe"
curl -L "$WIN_URL" -o "$WIN_OUT"

WIN_HASH=$(shasum -a 256 "$WIN_OUT" | cut -d ' ' -f1)
echo "✅ Windows hash: $WIN_HASH"

########################################
# 2. Update Scoop manifest
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
# 3. macOS builds for Homebrew (download)
########################################
echo "📥 Downloading macOS x64 executable..."
MAC_X64_OUT="$EXEC_DIR/keyshade-cli-macos-x64"
MAC_X64_URL="https://github.com/keyshade-xyz/keyshade/releases/download/v${REPO_VERSION}/keyshade-cli-macos-x64"
curl -L "$MAC_X64_URL" -o "$MAC_X64_OUT"
HASH_X64=$(shasum -a 256 "$MAC_X64_OUT" | cut -d ' ' -f1)
echo "✅ x64 hash: $HASH_X64"

echo "📥 Downloading macOS arm64 executable..."
MAC_ARM_OUT="$EXEC_DIR/keyshade-cli-macos-arm64"
MAC_ARM_URL="https://github.com/keyshade-xyz/keyshade/releases/download/v${REPO_VERSION}/keyshade-cli-macos-arm64"
curl -L "$MAC_ARM_URL" -o "$MAC_ARM_OUT"
HASH_ARM=$(shasum -a 256 "$MAC_ARM_OUT" | cut -d ' ' -f1)
echo "✅ arm64 hash: $HASH_ARM"

echo "📄 Updating Homebrew formula..."
cat > Formula/keyshade.rb <<EOF
class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.xyz"
  version "${CLI_VERSION}"
  license "MIT"

  on_macos do
    on_intel do
      url "${MAC_X64_URL}"
      sha256 "${HASH_X64}"
    end

    on_arm do
      url "${MAC_ARM_URL}"
      sha256 "${HASH_ARM}"
    end
  end

  def install
    if Hardware::CPU.intel?
      bin.install "keyshade-cli-macos-x64" => "keyshade"
    else
      bin.install "keyshade-cli-macos-arm64" => "keyshade"
    end
  end
end
EOF
echo "✅ Homebrew formula updated"

########################################
# 5. Generate install.sh
########################################
echo "📝 Generating Linux install.sh..."
cat > install.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

OS=$( . /etc/os-release && echo "$ID" )
ARCH=$(uname -m)

case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "❌ Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Determine the binary name based on OS + ARCH
case "$OS" in
  ubuntu|debian)
    BIN_NAME="keyshade-cli-linux-$ARCH"
    ;;
  rhel|centos)
    BIN_NAME="keyshade-cli-rhel-$ARCH"
    ;;
  amzn|amazon)
    BIN_NAME="keyshade-cli-amazonlinux-$ARCH"
    ;;
  *)
    echo "❌ Unsupported OS: $OS"
    exit 1
    ;;
esac

URL_BASE="https://github.com/keyshade-xyz/keyshade/releases/download/v__REPO_VERSION__"
URL="$URL_BASE/$BIN_NAME"
DEST="/usr/local/bin/keyshade"

echo "📥 Downloading Keyshade CLI ($BIN_NAME) from $URL..."
curl -L "$URL" -o "$DEST"
chmod +x "$DEST"

echo "✅ Keyshade CLI installed to $DEST"
EOF

# Now replace placeholder with actual version
sed -i.bak "s/__REPO_VERSION__/${REPO_VERSION}/g" install.sh && rm install.sh.bak

chmod +x install.sh
echo "✅ install.sh generated at ./install.sh"
########################################
# 4. Cleanup
########################################
echo "🧹 Cleaning up executables..."
rm -rf "$EXEC_DIR"

########################################
# 5. Commit changes
########################################
if [[ "$SHOULD_COMMIT" = true ]]; then
  echo "📦 Committing changes..."
  git add bucket/keyshade.json Formula/keyshade.rb
  git commit -m "chore(cli): update package managers to use v$CLI_VERSION [skip ci]"
fi

echo "✅ Done! CLI version bumped to $CLI_VERSION, repo version $REPO_VERSION"
