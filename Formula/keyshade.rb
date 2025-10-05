class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.xyz"
  version "3.3.0-stage.2"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.34.0-stage.14/keyshade-cli-macos-x64"
      sha256 "5a51e2901c6bc30b1e28e1ba721653df65c66ef426ea6e33f822bb3fc458d399"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.34.0-stage.14/keyshade-cli-macos-arm64"
      sha256 "43598e7a3132ca45eed1abe3a3557478e655d520013917a8a4780a246093983a"
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
