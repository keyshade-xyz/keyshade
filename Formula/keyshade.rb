class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.io"
  version "3.6.1"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.42.0/keyshade-cli-macos-x64"
      sha256 "f3cf481cfa75ec0a9155a6c4cde1efdbd2d1c12b46d87ae738ac724d1a3e67c4"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.42.0/keyshade-cli-macos-arm64"
      sha256 "1192f01a1a0279f51e80a5c6495af26169691ec87282fc3096184b2330250cfb"
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
