# md - Terminal Markdown Viewer Design

A fast, opinionated markdown pager. Not a TUI, not a browser - just a pager.

## Philosophy

### Core Principles

- **Do one thing well** - Render markdown beautifully, pipe to `less`, done
- **Respect the terminal** - No forced backgrounds, auto-detect width, use system pager
- **Fast startup** - No TUI framework overhead, minimal dependencies
- **Composable** - Works in pipes, disables formatting when appropriate
- **Beautiful defaults** - Catppuccin Frappe, soft hyphenation, proper typography

### Non-Goals

- File browsing / TUI mode
- Markdown editing
- Remote file fetching (use `curl | md`)
- Previewing while writing (use your editor)

### Differentiators from glow

| glow | md |
|------|-----|
| Full TUI with file browser | Just a pager |
| Custom built-in pager | Uses `$PAGER`/`less` |
| Forced background colors | Terminal background |
| Width detection issues | Reliable auto-detect |
| Basic code highlighting | Shiki-powered (VS Code quality) |
| Plain links | OSC 8 clickable hyperlinks |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLI                              │
│  src/index.ts - args, config loading, stdin detection   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    Renderer                             │
│  src/lib/render.ts - orchestrates the pipeline          │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐
│  Parser   │  │  Elements │  │  Output   │
│ (marked)  │  │ renderers │  │ (pager)   │
└───────────┘  └───────────┘  └───────────┘
                    │
    ┌───────┬───────┼───────┬───────┬───────┐
    ▼       ▼       ▼       ▼       ▼       ▼
 headers  code   tables  links  lists  blockquotes
         (shiki)       (OSC 8)
```

### Project Structure

```
src/
├── index.ts              # CLI entry
├── lib/
│   ├── render.ts         # Main render orchestration
│   ├── parser.ts         # Marked setup + custom renderer
│   ├── pager.ts          # Pager spawning logic
│   ├── config.ts         # XDG config loading
│   ├── width.ts          # Terminal width detection
│   └── elements/         # Per-element renderers
│       ├── heading.ts
│       ├── code.ts       # Shiki integration
│       ├── table.ts
│       ├── link.ts       # OSC 8 hyperlinks
│       ├── list.ts
│       ├── blockquote.ts
│       └── text.ts       # Hyphenation, wrapping
└── ui/
    ├── banner.ts         # ASCII art banner
    └── theme.ts          # Catppuccin Frappe theme
```

## Rendering Pipeline

### Flow

1. **Load config** - Read `~/.config/md/config.toml` if exists
2. **Detect width** - `process.stdout.columns` or config override
3. **Read input** - File or stdin
4. **Parse** - `marked` tokenizes markdown into AST
5. **Render** - Custom renderer walks AST, calls element renderers
6. **Output** - Count lines, decide pager vs direct write

### Output Decision Tree

```
stdout is TTY?
├─ No  → Write ANSI directly (no pager, for pipes)
└─ Yes → Content height > terminal height?
         ├─ No  → Write directly (short content)
         └─ Yes → Spawn $PAGER or less
```

### Marked Custom Renderer

```typescript
const renderer = {
  heading(text, level) { return renderHeading(text, level, theme) },
  code(code, lang)     { return renderCode(code, lang, config) },
  link(href, title, text) { return renderLink(href, text) },
  // ... etc
}

marked.use({ renderer })
const output = marked.parse(markdown)
```

Each element renderer is a pure function: `(content, options) → ANSI string`

### Lazy Loading Shiki

Code blocks are often the minority of content. Shiki is heavy (~2MB of grammars). Lazy-load only when the first code block is encountered, keeping startup fast for docs without code.

## Element Renderers

### Headings

```
# H1  →  ━━ H1 TEXT ━━━━━━━━━━━━━━━━━━━━━━━━━━━
## H2 →  ── H2 Text ──────────────────────────
### H3 → H3 Text
         (colored, no decoration)
```

H1 gets bold + full-width line, H2 gets dimmer line, H3+ just colored text.

### Code Blocks

- Shiki renders to ANSI with Catppuccin Frappe theme
- Wrap lines by default with `↪` continuation indicator
- Optional horizontal scroll mode via config
- Subtle top/bottom border with dim line

Inline `code` gets subtle highlight.

### Tables

```
┌──────────┬───────────┬──────────┐
│ Header 1 │ Header 2  │ Header 3 │
├──────────┼───────────┼──────────┤
│ Cell     │ Cell      │ Cell     │
└──────────┴───────────┴──────────┘
```

Unicode box-drawing characters. Auto-size columns to content, respect max width.

### Links

```typescript
// OSC 8 hyperlink escape sequence
const osc8 = `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`
// Plain style for terminals without OSC 8 support
const plain = `${text} (${dim(url)})`
```

Auto-detect OSC 8 support via `$TERM_PROGRAM` or config flag.

### Lists

```
  • Bullet item
    • Nested bullet
  1. Numbered item
     a. Nested numbered
```

Proper indentation preserved. Bullets use `•` not `-`.

### Text

- Soft hyphenation via `hyphen` library for better wrapping
- Configurable locale (default: en-us)
- Respects terminal width or configured override

## Configuration

**Location:** `~/.config/md/config.toml` (XDG_CONFIG_HOME respected)

### Default Config

```toml
# Theme - any Catppuccin flavor or "auto" for terminal detection
theme = "frappe"

# Width - "auto" or number of columns
width = "auto"

# Code blocks
[code]
wrap = true           # false = horizontal scroll
continuation = "↪"    # shown at start of wrapped lines
theme = "catppuccin-frappe"  # Shiki theme name

# Text
[text]
hyphenation = true    # soft hyphenation for prose
locale = "en-us"      # hyphenation language

# Links
[links]
osc8 = "auto"         # true/false/"auto" (detect terminal support)
show_urls = false     # always show URL even with OSC 8

# Pager
[pager]
command = ""          # empty = use $PAGER or "less -R"
args = ["-R", "-F", "-X"]  # -R: ANSI, -F: quit if fits, -X: no clear
```

### Loading with Bun

```typescript
import defaultConfig from './default-config.toml'

const configPath = `${Bun.env.XDG_CONFIG_HOME || '~/.config'}/md/config.toml`
const userConfig = await Bun.file(configPath).exists()
  ? await import(configPath)
  : {}

const config = deepMerge(defaultConfig, userConfig)
```

## CLI Interface

### Usage

```
md [file] [options]
cat file.md | md
```

### Flags

```
Options:
  -h, --help          Show help
  -v, --version       Show version
  -w, --width <n>     Override width (default: auto)
  -p, --plain         No colors, just rendered structure
  -r, --raw           Pass through without rendering
  --no-pager          Write directly, never spawn pager
  --scroll            Horizontal scroll for code (override config)
  --wrap              Wrap code blocks (override config)
```

### Behavior Matrix

| Scenario | Pager | Colors |
|----------|-------|--------|
| `md README.md` (long) | Yes | Yes |
| `md README.md` (short) | No | Yes |
| `md README.md --no-pager` | No | Yes |
| `md README.md --plain` | Yes | No |
| `cat README.md \| md` | Yes | Yes |
| `md README.md \| grep` | No | No |
| `md README.md > out.txt` | No | No |

When stdout isn't a TTY, disable pager and colors automatically.

## Dependencies

### Runtime

| Package | Purpose | Size |
|---------|---------|------|
| `marked` | Markdown parsing | ~40KB |
| `shiki` | Syntax highlighting | ~2MB (lazy loaded) |
| `hyphen` | Soft hyphenation | ~200KB |
| `picocolors` | ANSI colors | ~3KB |

### Build

Single binary via `bun build --compile`. Shiki grammars bundled. Expected binary size: ~5-8MB.

### To Remove

- `@clack/prompts` - Not needed
- `boxen`, `figlet`, `gradient-string` - Banner only, optional
