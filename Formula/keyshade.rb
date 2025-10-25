class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.io"
  version "3.6.0"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.41.0/keyshade-cli-macos-x64"
      sha256 "8d5f89617433dac8e1b4d6389c513eb3edf34d1ebbc119f09c9dfb6fc00c2ae5"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.41.0/keyshade-cli-macos-arm64"
      sha256 "c9af7f1ee7390fb0f982bc284e4babda45300185745924b584e182c31cbe11e2"
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
