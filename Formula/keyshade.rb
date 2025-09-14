class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.xyz"
  version "3.3.0-stage.2"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.34.0-stage.13/keyshade-cli-macos-x64"
      sha256 "ff69d06dd3c5617b132d5f75aa9c084cc80ae3613c5888cad2274ea832addff0"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.34.0-stage.13/keyshade-cli-macos-arm64"
      sha256 "3af940c1ceb63d3b6859262607c9267e90e9de0ac6f457f9bd7fa0f1536dbcb4"
    end
  end

  def install
    bin.install "keyshade-cli" => "keyshade"
  end
end
