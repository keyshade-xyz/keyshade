class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.io"
  version "3.8.0"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.49.0/keyshade-cli-macos-x64"
      sha256 "d557f664e5764f0af5aa7c9acfc74e78cc5d52d37d37231e9bbd31e7320de0af"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.49.0/keyshade-cli-macos-arm64"
      sha256 "7e3088648ca3d169e62853d8be9d6e162c4a41d01ceb6353534dc9f6c9a23105"
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
