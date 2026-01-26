# Advanced Configuration and Customization

Deep dive into advanced configuration options, custom themes, and extending the markdown viewer for power users.

## Configuration File Reference

The complete reference for all configuration options available in `~/.config/md/config.toml`.

### Core Settings

```toml
# Default theme to use (can be overridden with -t flag)
theme = "frappe"

# Terminal width setting
# "auto" - auto-detect terminal width
# "80", "100", "120", etc - fixed width in characters
width = "auto"

# True color (24-bit RGB) support
# "auto" - detect from terminal capabilities
# "true" - force enable
# "false" - force disable (use 256-color)
truecolor = "auto"

# Nerd Font symbols and icons
# "auto" - detect from font capabilities
# "true" - always use Nerd Font symbols
# "false" - use ASCII alternatives
nerd_fonts = "auto"
```

### Display Configuration

```toml
[display]
# Add responsive padding based on terminal width
# Automatically adds horizontal padding when terminal is wide enough
padding = true

# Maximum content width (affects centering)
# 0 = use full terminal width
# 40-200 = constrain to this width and center content
maxWidth = 0

# Enable responsive font size scaling
# Some terminals support font size detection and adjustment
responsiveFont = true
```

### Code Block Configuration

```toml
[code]
# Wrap long lines instead of horizontal scrolling
wrap = true

# Character to display when a line is wrapped
continuation = "→"

# Skip syntax highlighting for lines longer than this
skipHighlightThreshold = 16384

# Enable line numbers for code blocks
lineNumbers = false

# Background color for code blocks
# Uses theme colors by default
backgroundColor = "auto"

# Font family for code blocks (terminal-specific)
fontFamily = "monospace"
```

### Text Processing Configuration

```toml
[text]
# Enable smart word hyphenation
hyphenation = true

# Locale for hyphenation algorithm
# Supports: en-us, de-de, fr-fr, es-es, and others
locale = "en-us"

# Soft hyphen character to insert
softHyphen = "­"

# Enable smart justification
# Attempts to create even line lengths
justification = false

# Text paragraph spacing (lines)
paragraphSpacing = 1
```

### Link Configuration

```toml
[links]
# OSC8 hyperlink support
# "auto" - detect from terminal
# "true" - always generate OSC8 links
# "false" - never generate OSC8 links
osc8 = "auto"

# Display URL after link text
# Useful when OSC8 is not available
showUrls = false

# Color for link text
linkColor = "auto"

# Color for URLs (when showUrls = true)
urlColor = "auto"

# Underline link text
underline = true
```

### Pager Configuration

```toml
[pager]
# Pager command to use
# Common values: "less", "more", "vim", "bat"
# Empty string uses system default
command = ""

# Arguments to pass to pager
args = ["-r", "-F", "-K", "-X"]

# Disable pager for small outputs
# Don't use pager if output is shorter than terminal height
disableForSmallOutput = true

# Default pager height detection method
# "terminal" - use terminal height
# "fixed" - use fixed number of lines
heightDetection = "terminal"
```

### Performance Configuration

```toml
[performance]
# Enable caching of rendered output
cache = true

# Cache directory location
# Relative to config directory
cacheDir = ".cache"

# Maximum cache size in MB
maxCacheSize = 100

# Clear cache on startup
clearCacheOnStartup = false

# Parallel processing threads
# 0 = auto-detect CPU count
threads = 0
```

## Creating Custom Themes

### Theme File Structure

Create a custom theme in `~/.config/md/themes/my-theme.toml`:

```toml
# Custom theme definition
name = "My Custom Theme"
description = "A custom color theme for markdown display"

# Color palette - all colors in hex format
[colors]
# Background
background = "#1e1e2e"
foreground = "#cdd6f4"

# Text colors
text = "#cdd6f4"
bold = "#cdc6b8"
italic = "#d4a574"
code = "#eff1f5"
codeBackground = "#45475a"

# Heading colors
h1 = "#f38ba8"
h2 = "#fab387"
h3 = "#f9e2af"
h4 = "#a6e3a1"
h5 = "#94e2d5"
h6 = "#89b4fa"

# List colors
listMarker = "#f5c6f5"
taskChecked = "#a6e3a1"
taskUnchecked = "#89b4fa"

# Table colors
tableHeader = "#fab387"
tableBorder = "#45475a"
tableRow = "#cdd6f4"
tableAlt = "#313244"

# Link colors
link = "#89b4fa"
linkVisited = "#a6adc8"

# Blockquote colors
blockquote = "#7f849c"
blockquoteBorder = "#45475a"

# Special elements
horizontalRule = "#45475a"
emphasis = "#f38ba8"
warning = "#f38ba8"
success = "#a6e3a1"
info = "#89b4fa"
error = "#f38ba8"
```

### Using Custom Themes

1. Create theme file at `~/.config/md/themes/my-theme.toml`
2. Use with command: `md README.md -t my-theme`
3. Set as default in `~/.config/md/config.toml`:
   ```toml
   theme = "my-theme"
   ```

### Built-in Theme Variables

Access theme variables in configurations:

```toml
# Reference parent theme
parent = "dracula-soft"

# Override specific colors
[colors]
foreground = "#d4d4d4"
```

## CLI Options Deep Dive

### Width and Layout Options

```bash
# Auto-detect terminal width (default)
md README.md

# Set fixed width
md README.md -w 120

# Constrain to width with centering (requires maxWidth in config)
md README.md -w 100
```

### Theme Options

```bash
# List all available themes
md --list-themes

# Use specific theme
md README.md -t gruvbox-dark-hard

# Show theme details
md --theme-info dracula-soft
```

### Display Options

```bash
# Plain text output (no colors)
md README.md -p

# Raw markdown (no rendering)
md README.md -r

# No pager (direct output)
md README.md --no-pager

# Use horizontal scrolling for code
md README.md --scroll

# Force code wrapping
md README.md --wrap
```

### Verbosity and Debugging

```bash
# Verbose output with debug info
md README.md --verbose

# Show rendering statistics
md README.md --stats

# Profile rendering performance
md README.md --profile

# Dry run (parse but don't render)
md README.md --dry-run
```

## Environment Variables

Configure behavior via environment variables:

```bash
# Override config file location
export MD_CONFIG_PATH=~/.config/my-markdown-display/config.toml

# Force theme
export MD_THEME=rose-pine-moon

# Force terminal width
export MD_WIDTH=100

# Disable true color
export MD_TRUECOLOR=false

# Force Nerd Fonts
export MD_NERD_FONTS=true

# Pager command
export MD_PAGER=less
export MD_PAGER_ARGS="-r -F -K"

# Performance settings
export MD_CACHE=true
export MD_THREADS=4

# Debug mode
export MD_DEBUG=true
export MD_VERBOSE=true
```

## Advanced Usage Patterns

### Viewing Multiple Files with Different Settings

Create a shell function for convenience:

```bash
# View multiple markdown files with consistent settings
viewdocs() {
    local theme="${1:-dracula-soft}"
    local width="${2:-100}"
    shift 2
    md "$@" -t "$theme" -w "$width"
}

# Usage
viewdocs rose-pine-moon 120 file1.md file2.md
```

### Integrating with Git Workflow

View documentation while reviewing changes:

```bash
# View a markdown file from a specific Git commit
md <(git show HEAD:docs/README.md)

# Compare markdown files across branches
md <(git show main:docs/guide.md) <(git show feature:docs/guide.md)

# View file from unstaged changes
md <(git diff HEAD docs/README.md)
```

### Pipe and Stream Processing

Process markdown through pipes:

```bash
# Generate markdown dynamically and view
(echo "# Generated Documentation" && date) | md

# Combine multiple files and view
cat intro.md features.md reference.md | md

# Process with other tools
pandoc source.rst -t markdown | md
```

### Batch Processing

Process multiple files programmatically:

```bash
# View all markdown files in a directory
for file in docs/*.md; do
    echo "=== $file ==="
    md "$file" --no-pager
done

# Search and view matching files
find . -name "*.md" -type f | while read file; do
    if grep -q "important" "$file"; then
        md "$file"
    fi
done
```

## Performance Tuning

### Optimization Tips

1. **For Large Files**
   ```bash
   # Disable syntax highlighting for faster rendering
   md large-file.md -p

   # Use fixed width to reduce calculation
   md large-file.md -w 100

   # Disable hyphenation
   # Set hyphenation = false in config
   ```

2. **For Slow Terminals**
   ```bash
   # Disable colors
   md file.md -p

   # Use ASCII output (no Unicode)
   # Reduces terminal character count

   # Increase pager scroll size
   export MD_PAGER_ARGS="-r -F -K -e"
   ```

3. **For Fast Rendering**
   ```bash
   # Enable caching
   # Set cache = true in config

   # Increase thread count
   export MD_THREADS=8

   # Use fixed width (avoids width detection)
   md file.md -w 100
   ```

### Benchmarking

Test performance with the profiling option:

```bash
# Show rendering statistics
md large-file.md --profile

# Measure startup time
time md README.md --no-pager

# Profile specific operations
md README.md --profile --verbose
```

## Troubleshooting Configuration

### Common Issues and Solutions

**Issue**: Colors not displaying

```toml
# Explicitly enable true color
truecolor = "true"
```

**Issue**: Nerd Font icons showing as boxes

```toml
# Disable Nerd Fonts
nerd_fonts = "false"
```

**Issue**: Text wrapping too aggressive

```toml
[display]
# Increase max width
maxWidth = 120
padding = false
```

**Issue**: Code blocks not wrapping

```toml
[code]
# Enable wrapping
wrap = true
continuation = "→"
```

**Issue**: Pager not working

```bash
# Check pager command
echo $PAGER

# Override in config
# Or use environment variable
export MD_PAGER=less
```

## Configuration Best Practices

### Recommended Setups

**For Documentation Reading**

```toml
theme = "dracula-soft"
width = "auto"
truecolor = "auto"
nerd_fonts = "auto"

[display]
padding = true
maxWidth = 120

[code]
wrap = true

[text]
hyphenation = true
```

**For Code Review**

```toml
theme = "github-dark"
width = "auto"

[display]
maxWidth = 100

[code]
lineNumbers = true
wrap = false  # Use scrolling for exact code viewing

[links]
showUrls = true
```

**For Accessibility**

```toml
theme = "solarized-light"  # High contrast
width = "100"

[display]
padding = false

[text]
hyphenation = false

[code]
backgroundColor = "explicit"  # Clear distinction
```

### Configuration Migration

Upgrade from older versions:

```bash
# Backup current config
cp ~/.config/md/config.toml ~/.config/md/config.toml.backup

# Check for deprecated options
grep -E "deprecated|removed" ~/.config/md/config.toml

# Review changelog for breaking changes
# Update config accordingly
```

## Advanced Topics

### Plugin Architecture (Future)

Future versions will support plugins:

```javascript
// Example plugin structure (not yet available)
export function renderCustomElement(element) {
  if (element.type === 'custom-block') {
    return renderSpecialBlock(element);
  }
}
```

### Extending the Theme System

Currently planned for v0.4.0:

- Base theme inheritance
- Color variable definitions
- Conditional styling rules
- Animation definitions

### Custom Output Formats

Planned extensions:

- HTML output with embedded CSS
- PDF generation with proper formatting
- ANSI art export
- SVG rendering

## Resources

- **Configuration Schema**: `/docs/config-schema.json`
- **Theme Gallery**: `md --list-themes` (built-in)
- **Example Themes**: `~/.config/md/themes/`
- **Troubleshooting Guide**: Documentation folder
- **Community Configs**: GitHub discussions

For help with configuration, refer to the main documentation or open an issue on GitHub.
