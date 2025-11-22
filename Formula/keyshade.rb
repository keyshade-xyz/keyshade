class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.io"
  version "3.7.0"
  license "MIT"

  on_macos do
    on_intel do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.46.0/keyshade-cli-macos-x64"
      sha256 "5bb101b64a12533f78a031d65248fdaa7a41206bfcb68071585b8df1adbe321a"
    end

    on_arm do
      url "https://github.com/keyshade-xyz/keyshade/releases/download/v2.46.0/keyshade-cli-macos-arm64"
      sha256 "f666c1975d9e5de6f792496be0528c8ade60c4a7972796828d681d303a096229"
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
