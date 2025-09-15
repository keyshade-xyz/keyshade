class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.xyz"
  version "3.3.0-stage.2"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.34.0-stage.14/keyshade-cli-macos-x64"
      sha256 "926306cb5034d0a5cdfa4b582d4589535b9bc4487d96a3c47f1c946ab5f048e5"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.34.0-stage.14/keyshade-cli-macos-arm64"
      sha256 "def69de9ec4b1f9a67f30711b80e387bdc92513992f58dc88fd91680baab66b2"
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
