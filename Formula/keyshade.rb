class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.io"
  version "3.7.0"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.44.0/keyshade-cli-macos-x64"
      sha256 "c3c80c932cf50ee3ae77c2a618472b59fd71281e51ec1792bd63310546022ac4"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.44.0/keyshade-cli-macos-arm64"
      sha256 "0996cb9595583d57510e81ea04d8ce208727ee8205fcd4c06d6da7a5f0a6409f"
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
