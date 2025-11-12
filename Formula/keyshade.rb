class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.io"
  version "3.6.3"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.43.0/keyshade-cli-macos-x64"
      sha256 "c243d8963155e7590a1533e7b28e4eac83bac30cb04a0f6a7fc789c6c6fe0939"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.43.0/keyshade-cli-macos-arm64"
      sha256 "08617aa6aad15d9fab44938cb9656cce7c47f0dfbad7de1dc3e4261a9d0cd652"
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
