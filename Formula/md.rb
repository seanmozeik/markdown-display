class Md < Formula
  desc "Beautiful terminal markdown viewer"
  homepage "https://github.com/seanmozeik/markdown-display"
  version "0.3.5"
  license "MIT"

  # Built by `bun run build` → `artifacts/md-{version}.tar.gz`; checksum patched from that file.
  url "https://github.com/seanmozeik/markdown-display/releases/download/v#{version}/md-#{version}.tar.gz"
  sha256 "48ef957fe9fb227953b48d7a12e11e1851f06b63613ab5483c196eed3ab1cbb7"

  depends_on "oven-sh/bun/bun"

  def install
    # Install all bundled files to libexec
    libexec.install Dir["*"]

    # Create wrapper script (matches npm pack layout: dist/md.js)
    (bin/"md").write <<~EOS
      #!/bin/bash
      exec "#{Formula["bun"].opt_bin}/bun" "#{libexec}/dist/md.js" "$@"
    EOS
  end

  test do
    assert_match "md", shell_output("#{bin}/md --help")
  end
end
