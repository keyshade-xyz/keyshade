class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.io"
  version "3.6.3"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.43.0/keyshade-cli-macos-x64"
      sha256 "0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.43.0/keyshade-cli-macos-arm64"
      sha256 "0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5"
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
