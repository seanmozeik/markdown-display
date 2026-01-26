# Getting Started with the Markdown Viewer

A comprehensive guide to viewing and navigating markdown files in your terminal using the `md` command.

## Overview

The markdown viewer is a powerful terminal-based tool designed to render markdown files with beautiful formatting, syntax highlighting, and responsive layout. Whether you're reading documentation, technical guides, or project notes, this tool brings markdown to life in the terminal.

### Key Features

- **Syntax Highlighting**: 70+ programming languages with theme-matched colors
- **Responsive Layout**: Automatic terminal width detection with customizable width constraints
- **31+ Color Themes**: From popular themes like Dracula to Catppuccin variants
- **Smart Text Wrapping**: Intelligent word wrapping with optional hyphenation
- **Interactive File Picker**: Fuzzy search through markdown files
- **Pager Integration**: Seamless integration with your terminal pager

## Installation

Before using the markdown viewer, ensure you have the latest version installed. The binary is named differently on Windows:

- **macOS/Linux**: `md`
- **Windows**: `mdown`

If you're on Windows and want to use `md` as the command, add this alias to your PowerShell profile:

```powershell
Set-Alias -Name md -Value mdown -Option AllScope
```

## Basic Usage

### Viewing a Single File

The simplest way to view a markdown file is to pass the filename as an argument:

```bash
md README.md
md docs/tutorial.md
```

### Viewing Multiple Files

You can view multiple markdown files in sequence. Each file will be displayed with a header separator:

```bash
md file1.md file2.md file3.md
```

### Interactive File Picker

If you don't specify any files, the markdown viewer opens an interactive file picker:

```bash
md
```

Use fuzzy search to find the file you want to view. The picker supports:

- **Arrow Keys**: Navigate up/down through results
- **Type**: Fuzzy search file names
- **Enter**: Select the highlighted file
- **Escape**: Cancel

## Command-Line Options

### Display Options

- `-w, --width <n>`: Set the output width in characters (default: auto-detect)
- `-t, --theme <name>`: Choose a color theme
- `-p, --plain`: Disable all colors (plain text output)
- `--list-themes`: Display all available themes

### Rendering Options

- `--wrap`: Enable code line wrapping (default behavior)
- `--scroll`: Use horizontal scrolling for long code lines
- `--no-pager`: Output directly without using a pager

### Information

- `-h, --help`: Show help message
- `-v, --version`: Display version number

## Common Examples

### View with a specific width

```bash
md README.md -w 120
```

### View with Dracula theme

```bash
md guide.md -t dracula-soft
```

### View without colors

```bash
md document.md -p
```

### View multiple files without pager

```bash
md file1.md file2.md --no-pager
```

### List all available themes

```bash
md --list-themes
```

## Configuration

The markdown viewer can be configured via `~/.config/md/config.toml`. Here's a complete example:

```toml
# Default theme to use
theme = "frappe"

# Terminal width: "auto" or a number (80-200)
width = "auto"

# True color support: "auto", "true", or "false"
truecolor = "auto"

# Nerd Font symbols: "auto", "true", or "false"
nerd_fonts = "auto"

[display]
# Add responsive padding based on terminal width
padding = true

# Maximum content width (0 = full width, 80-120 = constrained and centered)
maxWidth = 0

[code]
# Wrap long lines in code blocks
wrap = true

# Character to show at line continuation
continuation = "→"

[text]
# Enable smart hyphenation for better text wrapping
hyphenation = true

# Locale for hyphenation (e.g., "en-us", "de-de", "fr-fr")
locale = "en-us"

[links]
# OSC8 hyperlinks: "auto", "true", or "false"
osc8 = "auto"

# Show URLs after link text
show_urls = false

[pager]
# Custom pager command (defaults to "less")
command = ""

# Arguments for the pager
args = ["-r", "-F", "-K", "-X"]
```

### Configuration File Location

The configuration file should be placed at `~/.config/md/config.toml`. If the directory doesn't exist, create it:

```bash
mkdir -p ~/.config/md
touch ~/.config/md/config.toml
```

## Themes

The viewer supports 31+ color themes. Popular options include:

### Catppuccin Collection

- `frappe` (default)
- `latte`
- `macchiato`
- `mocha`

### GitHub Themes

- `github-dark`
- `github-dark-dimmed`
- `github-light`

### Dracula Variants

- `dracula-soft`

### Rose Pine Collection

- `rose-pine`
- `rose-pine-dawn`
- `rose-pine-moon`

### Material Theme

- `material-theme`
- `material-theme-darker`
- `material-theme-ocean`

### Gruvbox Collection

- `gruvbox-dark-hard`
- `gruvbox-dark-soft`
- `gruvbox-light-hard`

### Solarized

- `solarized-dark`
- `solarized-light`

To see all available themes, run:

```bash
md --list-themes
```

## Supported Markdown Elements

The markdown viewer fully supports standard markdown formatting:

- **Headings**: H1 through H6 with unique styling for each level
- **Lists**: Unordered, ordered, and nested lists
- **Code Blocks**: Syntax-highlighted with language detection
- **Inline Code**: Styled with background color and padding
- **Text Formatting**: Bold, italic, and combined formatting
- **Links**: Clickable hyperlinks with OSC8 support (when available)
- **Tables**: Bordered tables with automatic column width distribution
- **Blockquotes**: Nested blockquote support with visual indentation
- **Horizontal Rules**: Decorative separator lines

Each element is rendered with appropriate spacing, alignment, and styling to match your chosen theme.

## Tips and Tricks

### Use with Git

View documentation while reviewing code changes:

```bash
md docs/ARCHITECTURE.md -w 100
```

### Combine with Other Tools

Pipe markdown content to the viewer:

```bash
cat guide.md | md
```

### Theme Switching

Quickly preview how a document looks in different themes:

```bash
md README.md -t dracula-soft
md README.md -t rose-pine-moon
md README.md -t github-dark
```

### Full Width Terminal

For maximum readability on wide terminals:

```bash
md document.md -w 200
```

### Minimal Width

For testing responsive text wrapping:

```bash
md document.md -w 80
```

## Keyboard Shortcuts in Pager

When the output is displayed in a pager (default behavior), you can use standard pager commands:

- **Space** or **Page Down**: Next page
- **b** or **Page Up**: Previous page
- **/**: Search forward
- **?**: Search backward
- **q**: Quit and return to terminal
- **G**: Jump to end
- **g**: Jump to beginning

## Terminal Requirements

The markdown viewer works best with:

- **Terminal Color Support**: 256-color or true color (24-bit RGB)
- **Font**: Optional Nerd Font for icon symbols (gracefully falls back without it)
- **Width**: Minimum 40 characters recommended; works with narrower terminals

The viewer auto-detects your terminal's capabilities and adjusts formatting accordingly.

## Troubleshooting

### Colors Not Displaying

If colors aren't showing, try enabling true color explicitly:

```bash
md README.md --truecolor=true
```

Or set in config:

```toml
truecolor = "true"
```

### Text Wrapping Issues

If text isn't wrapping correctly, specify a width:

```bash
md document.md -w 100
```

### Nerd Font Icons Not Showing

Disable Nerd Font symbols if your terminal doesn't support them:

```bash
md README.md --nerd-fonts=false
```

Or in config:

```toml
nerd_fonts = "false"
```

## Next Steps

Now that you understand the basics, explore:

1. Different themes to find your preferred look
2. Configuration options to customize behavior
3. Keyboard shortcuts in the pager for navigation
4. Using the tool with your project documentation

Happy reading!
