class Md < Formula
  desc "Beautiful terminal markdown viewer"
  homepage "https://github.com/seanbreckenridge/markdown-display"
  version "0.0.1"
  license "MIT"

  # URL to bundled source (single JS file)
  url "https://github.com/seanbreckenridge/markdown-display/releases/download/v#{version}/md-#{version}.tar.gz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"

  depends_on "bun"

  def install
    # Install all bundled files to libexec
    libexec.install Dir["*"]

    # Create shim that runs: bun /path/to/libexec/index.js
    (bin/"md").write_env_script "bun", libexec/"index.js"
  end

  test do
    assert_match "md v#{version}", shell_output("#{bin}/md --version")
  end
end
