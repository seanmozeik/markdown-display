class Md < Formula
  desc "Beautiful terminal markdown viewer"
  homepage "https://github.com/seanmozeik/markdown-display"
  version "0.1.0"
  license "MIT"

  # URL to bundled source (single JS file)
  url "https://github.com/seanmozeik/markdown-display/releases/download/v#{version}/md-#{version}.tar.gz"
  sha256 "b69e3dc6a85fc91fe35d71963aff7862d1e15d5a1618878517c90ea1337a8ed9"

  depends_on "bun"

  def install
    # Install all bundled files to libexec
    libexec.install Dir["*"]

    # Create wrapper script
    (bin/"md").write <<~EOS
      #!/bin/bash
      exec "#{Formula["bun"].opt_bin}/bun" "#{libexec}/index.js" "$@"
    EOS
  end

  test do
    assert_match "md", shell_output("#{bin}/md --help")
  end
end
