class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.xyz"
  version "3.3.0-stage.2"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.34.0-stage.13/keyshade-cli-macos-x64"
      sha256 "f94d32e41d9393fb9d7acc3d5ce2d91f20b30be6062f3f07867baf097fa298f6"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.34.0-stage.13/keyshade-cli-macos-arm64"
      sha256 "a30192a679d897edcb4a9d4521bee116dc11583777644b0e9d336da03416af8e"
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
