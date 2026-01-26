# md (markdown-display)

A markdown viewer for the terminal.

## Features

**Syntax highlighting** — Shiki, the same engine VS Code uses. 100+ languages. Long lines wrap without breaking ANSI color state.

**33 themes** — Catppuccin, Dracula, GitHub, Gruvbox, Material, Nord, One Dark, Rose Pine, Solarized, Tokyo Night. Default is Catppuccin Frappé.

**Clickable links** — OSC 8 hyperlinks. Works in iTerm, WezTerm, VS Code terminal, kitty, Alacritty, Hyper.

**Paging** — Pipes to `less` when content exceeds terminal height. Short files print directly. Honors `$MD_PAGER` and `$PAGER`.

**Layout** — Width adapts to terminal, capped at 120 characters. Optional centering with `maxWidth`.

**Typography** — Soft hyphenation at syllable boundaries. Unicode box-drawing for tables. Nested blockquotes. Multi-level lists.

**Nerd Fonts** — Language icons in code block headers when available.

**Fast** — Bun. Standalone binary. No runtime dependencies.

**Truecolor** — 24-bit RGB when supported, degrades to 256-color on older terminals. Auto-detected.

**Standards** — Respects `NO_COLOR` and `--no-color`. Runs on macOS, Linux, Windows.

```bash
md README.md
md README.md CHANGELOG.md
cat file.md | md
curl -s https://example.com/doc.md | md
```

## Install

**Homebrew**

```bash
brew install seanmozeik/tap/md
```

**From source** (requires [Bun](https://bun.sh))

```bash
git clone https://github.com/mozeik/markdown-display.git
cd markdown-display
bun install
bun run build
```

Produces a standalone binary. Move it to your PATH.

**Windows** — Binary is `mdown` to avoid conflict with the built-in `md` command.

```powershell
Set-Alias -Name md -Value mdown -Option AllScope
```

## Usage

```bash
md README.md
md README.md CHANGELOG.md
md docs/guide.md --width 80
```

Multiple files are concatenated with filename headers.

```
-w, --width <n>     Output width (default: auto)
-t, --theme <name>  Color theme
--list-themes       Show available themes
-p, --plain         No colors
-r, --raw           Pass through unrendered
--no-color          Disable colors (same as NO_COLOR=1)
--no-pager          Print directly, skip pager
--scroll            Horizontal scroll for code
--wrap              Wrap code (default)
```

## Configuration

`~/.config/md/config.toml`

```toml
theme = "frappe"
width = "auto"
truecolor = "auto"
nerd_fonts = "auto"

[display]
padding = true
maxWidth = 0

[code]
wrap = true
continuation = "→"

[text]
hyphenation = true
locale = "en-us"

[links]
osc8 = "auto"
show_urls = false

[pager]
command = ""
args = ["-r", "-F", "-K", "-X"]
```

| Setting | Description |
|---------|-------------|
| `theme` | Color scheme. `md --list-themes` for options. |
| `width` | Output width. `"auto"` uses terminal (max 120). |
| `truecolor` | 24-bit color. `"auto"` detects, `true` forces, `false` uses 256-color. |
| `nerd_fonts` | Icon support. `"auto"` detects. |
| `display.padding` | Margins based on terminal width. |
| `display.maxWidth` | Content width limit. 0 for full width. |
| `code.wrap` | Wrap long lines. `false` for horizontal scroll. |
| `code.continuation` | Character at line breaks. |
| `text.hyphenation` | Break words at syllables. |
| `text.locale` | Hyphenation language. |
| `links.osc8` | Clickable hyperlinks. |
| `links.show_urls` | Print URL after link text. |
| `pager.command` | Custom pager. Empty uses `$MD_PAGER`, `$PAGER`, or `less`. |
| `pager.args` | Pager arguments. |

## Build

```bash
bun run build      # standalone binary
bun run dev        # development
bun test           # tests
bun run check      # lint + format
```

## License

MIT
