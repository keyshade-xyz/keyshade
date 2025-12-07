class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.io"
  version "3.7.0"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.47.0/keyshade-cli-macos-x64"
      sha256 "6b405ea0c7563329bc1c22747b9284763cb11d271737ed3f12ba429ddd2be970"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.47.0/keyshade-cli-macos-arm64"
      sha256 "1b7dbdb651307e0ba13759be916f83f4a884f9d901976d9d9453a61080d4ab1b"
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
