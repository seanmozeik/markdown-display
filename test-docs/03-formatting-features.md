# Markdown Formatting Features

Comprehensive guide to all formatting elements supported by the markdown viewer.

## Text Formatting

### Basic Formatting

This section demonstrates **bold text**, *italic text*, and ***bold italic text***. You can also use `inline code` within sentences for highlighting specific terms like `function names` or `variable names`.

The viewer intelligently handles text wrapping with support for hyphenation. This means long paragraphs will wrap gracefully at word boundaries and, when enabled in configuration, break at syllable boundaries for better justification.

### Emphasis Combinations

Use formatting strategically:

- **Important Notice**: This is a critical piece of information
- ***Very Important***: This requires immediate attention
- `const x = 5;` - Inline code examples
- **`function_name()`** - Bold code for highlighting API functions
- ***Highlighted and emphasized*** - Maximum attention

## Lists

### Unordered Lists

Basic bullet list with three nesting levels:

- First item in the list
  - Nested item one
    - Deeply nested item
    - Another deeply nested item
  - Nested item two
- Second item in the list
- Third item with a longer description that wraps across multiple lines to demonstrate how the viewer handles text wrapping in list items while maintaining proper indentation and visual hierarchy
  - Nested item under the long item
  - Another nested item

### Ordered Lists

Numbered lists with proper nesting:

1. First step in the process
2. Second step with multiple sub-steps
   1. First sub-step
   2. Second sub-step
   3. Third sub-step with explanation: This demonstrates how nested ordered lists maintain proper numbering and indentation when displayed in the terminal
3. Third step in the main process
   1. Sub-step one
   2. Sub-step two
4. Fourth step
5. Fifth step

### Mixed Lists

Combining ordered and unordered lists:

1. First requirement
   - Sub-requirement A
   - Sub-requirement B
     1. Detailed point one
     2. Detailed point two
2. Second requirement
   - Another consideration
3. Third requirement

### Task Lists

Track progress with checkboxes:

- [x] Complete project setup
- [x] Install dependencies
- [x] Create initial components
- [ ] Implement feature A
  - [x] Design API structure
  - [ ] Write backend implementation
  - [ ] Add unit tests
- [ ] Implement feature B
- [ ] Write documentation
- [ ] Deploy to production
- [ ] Monitor for issues

Task lists are useful for:

- Project tracking
- Development checklists
- Bug fix verification
- Documentation requirements
- Testing procedures

## Tables

### Basic Table

Tables display with borders and proper column alignment:

| Feature | Version | Status | Notes |
|---------|---------|--------|-------|
| Syntax Highlighting | 0.3.2 | ✓ Stable | 70+ languages supported |
| Theme Support | 0.3.2 | ✓ Stable | 31+ themes available |
| Text Wrapping | 0.3.2 | ✓ Stable | Hyphenation enabled |
| Code Wrapping | 0.3.2 | ✓ Stable | Configurable line continuation |
| Interactive Picker | 0.3.2 | ✓ Stable | Fuzzy search included |

### Feature Comparison Table

A more complex table comparing different aspects:

| Theme | Type | Language Support | File Size | Performance |
|-------|------|-----------------|-----------|-------------|
| Catppuccin Frappe | Warm | Modern, dark | Small | Fast |
| Dracula Soft | Cool | Retro, dark | Small | Fast |
| GitHub Dark | Professional | Modern, dark | Small | Fast |
| Rose Pine Moon | Creative | Modern, dark | Small | Fast |
| Gruvbox Dark | Classic | Retro, dark | Small | Fast |
| Material Theme | Material Design | Modern, dark | Medium | Fast |
| Solarized Dark | Scientific | Classic, dark | Small | Fast |

### Configuration Comparison

| Option | Default | Range | Impact |
|--------|---------|-------|--------|
| `width` | auto | auto or 40-200 | Controls output width |
| `theme` | frappe | 31+ options | Affects all colors |
| `truecolor` | auto | auto/true/false | 24-bit RGB color support |
| `nerd_fonts` | auto | auto/true/false | Icon and symbol display |
| `wrap` | true | true/false | Code line behavior |
| `padding` | true | true/false | Responsive content padding |
| `maxWidth` | 0 | 0 or 80-200 | Maximum content width |

## Blockquotes

### Single-Level Quotes

> This is a blockquote. It's useful for highlighting important information, citations, or callouts that stand out from the main text. The blockquote maintains proper indentation and can span multiple lines while preserving formatting.

### Nested Blockquotes

The viewer supports multiple levels of nested blockquotes:

> This is the first level of quoting.
>
> > This is a nested blockquote, showing deeper emphasis.
> >
> > > And this is a triple-nested blockquote for maximum emphasis.
> >
> > Back to the second level.
>
> Back to the first level.

### Quotes with Formatting

Blockquotes can contain other formatted elements:

> **Important Note**: The markdown viewer is designed for optimal terminal readability. As stated by the creator:
>
> > "Terminal markdown should be beautiful, not just functional."
>
> This philosophy guides every design decision in the tool.

### Citation Blockquote

> "The key to good documentation is clarity and structure. Markdown provides the format, and the viewer brings it to life in your terminal."
>
> — Terminal Markdown Viewer Documentation

## Horizontal Rules

A horizontal rule divides content sections:

---

This separator is useful for breaking up long documents into logical sections without using additional heading levels.

---

Another section starts here with a visual break above.

---

## Links

### Basic Links

Here are examples of links in markdown:

- [Official Documentation](https://github.com/anthropics/claude-code)
- [Terminal Colors Guide](https://en.wikipedia.org/wiki/ANSI_escape_code)
- [Markdown Specification](https://commonmark.org/)

### Links in Context

The markdown viewer supports OSC8 hyperlinks when available. This means if your terminal supports it (like iTerm2, WezTerm, VS Code, or kitty), you can **click links directly** to open them in your browser.

Some terminals that support OSC8 hyperlinks:

- [iTerm.app](https://iterm2.com) - macOS terminal
- [WezTerm](https://wezfm.org/) - Cross-platform terminal
- [VS Code Integrated Terminal](https://code.visualstudio.com)
- [kitty](https://sw.kovidgoyal.net/kitty/) - GPU-based terminal

When OSC8 is not available, the viewer displays the URL after the link text, allowing you to manually navigate if needed.

### Links with Code

You can combine links with inline code:

- Check out the [`marked` library](https://marked.js.org/)
- Learn about [`shiki` syntax highlighting](https://shiki.matsu.io/)
- Review the [`hyphen` library documentation](https://github.com/ytiurin/hyphen)

## Combined Formatting Examples

### Documentation Style

The following example shows how multiple formatting elements work together:

> **Important**: Always configure your `~/.config/md/config.toml` before first use.

The configuration should look like:

```toml
theme = "frappe"
width = "auto"
truecolor = "auto"
nerd_fonts = "auto"
```

To verify your setup:

1. Create the config directory: `mkdir -p ~/.config/md`
2. Copy the example config: `cp config.toml ~/.config/md/`
3. Edit the file: `nano ~/.config/md/config.toml`
4. Test the viewer: `md README.md`

### Article Style

# Featured Article

## Understanding Terminal Colors

The history of terminal colors spans decades:

- **1970s-1980s**: Basic ANSI colors (8 colors)
- **1980s-1990s**: Extended support (16 colors)
- **1990s-2000s**: 256-color mode (ANSI 256)
- **2010s-present**: True color / 24-bit RGB

Modern terminals support:

| Generation | Colors | Use Case | Status |
|-----------|--------|----------|--------|
| Legacy | 8 colors | Basic terminals | Works everywhere |
| Extended | 16 colors | Improved contrast | Widely supported |
| 256-color | 256 colors | Better gradients | Commonly available |
| True color | 16.7M colors | Photo-quality | Recommended |

> The markdown viewer automatically detects your terminal's color capability and adjusts accordingly, ensuring beautiful output whether you're using a legacy terminal or the latest terminal emulator.

### Callout Boxes

> **Tip**: Use the `--list-themes` option to see all available color themes and pick your favorite.

> **Warning**: Some configuration options may require terminal restart to take effect.

> **Best Practice**: Always validate your configuration file syntax before viewing documents.

> **Note**: Using unsupported theme names will use the default theme.

## Special Characters and Symbols

The markdown viewer handles special characters correctly:

- Copyright: © 2024
- Trademark: ™
- Registered: ®
- Mathematical: ± × ÷ √ ∞ ≈
- Arrows: → ← ↑ ↓ ⇒ ⇐
- Unicode: 你好 · مرحبا · שלום
- Emoji support: ✨ 🎉 🚀 📝 ✅

When Nerd Fonts are enabled, additional symbols are available:

-  Editor icon
-  Settings icon
-  Code brackets icon
-  Theme icon

## Typography and Layout

### Paragraph Alignment

The markdown viewer respects natural paragraph flow:

This paragraph demonstrates how the viewer handles justified text wrapping. Long lines of text are intelligently broken at word boundaries. When hyphenation is enabled in your configuration, the viewer can break words at syllable boundaries (syl-la-ble break-down) for more balanced line lengths.

The **responsive padding** feature automatically adds horizontal padding based on your terminal width, keeping text at a comfortable reading width (typically 80-120 characters per line).

### Line Length Considerations

Short terminal window:

- Limited space
- Text wraps frequently
- Padding disabled
- Narrow code blocks

Wide terminal window:

- Ample horizontal space
- Longer lines
- Responsive padding added
- Content stays readable with max-width constraint

This responsive behavior ensures the markdown viewer looks great on any terminal size.

## Accessibility and Readability

The markdown viewer includes several features for better accessibility:

1. **Color Contrast**: All themes provide sufficient contrast for readability
2. **Text Alternatives**: Links show URLs as alternate text when needed
3. **Plain Text Mode**: Use the `-p` flag to disable colors entirely
4. **Configurable Width**: Adjust line length for easier reading on any device
5. **Keyboard Navigation**: Works entirely with keyboard in the pager interface
6. **Static Rendering**: No animation effects that could distract from content

## Summary of Formatting

The markdown viewer supports all standard markdown elements:

- ✓ Headings (H1-H6)
- ✓ Lists (ordered, unordered, nested, task)
- ✓ Tables (with proper borders and alignment)
- ✓ Blockquotes (single and nested)
- ✓ Code blocks (70+ languages with syntax highlighting)
- ✓ Inline code and formatting
- ✓ Links (with OSC8 hyperlink support)
- ✓ Horizontal rules
- ✓ Text formatting (bold, italic, combinations)
- ✓ Special characters and symbols

All elements work together to create beautiful, readable terminal documents.
