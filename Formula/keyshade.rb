class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.io"
  version "3.6.4"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.43.1/keyshade-cli-macos-x64"
      sha256 "f051b3abec538503ff937cd40b79c5aa33a7b5d20f35956b4fd8da82f701202f"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.43.1/keyshade-cli-macos-arm64"
      sha256 "f0c4fa6d626281e753e560941125a62d64e3c6c2ab0c0f8542186321a13cf24c"
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
