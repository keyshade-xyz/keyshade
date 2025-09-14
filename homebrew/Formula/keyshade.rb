class Keyshade < Formula
  desc "Keyshade CLI - Secure, real-time secret and configuration management"
  homepage "https://keyshade.xyz"
  version "0.0.0"

  if Hardware::CPU.arm?
    url "https://github.com/keyshade-xyz/keyshade/releases/download/v0.0.0/keyshade-cli-macos-arm64"
    sha256 ""
  else
    url "https://github.com/keyshade-xyz/keyshade/releases/download/v0.0.0/keyshade-cli-macos-x64"
    sha256 ""
  end

  def install
    if Hardware::CPU.arm?
      bin.install "keyshade-cli-macos-arm64" => "keyshade"
    else
      bin.install "keyshade-cli-macos-x64" => "keyshade"
    end
  end

  test do
    system "#{bin}/keyshade", "--version"
  end
end
