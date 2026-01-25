# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-01-25

### Added
- Add ability to set a maximum width for tables, improving readability in narrow terminals.
- Add file separators between table outputs for clearer visual separation.

## [0.2.0] - 2026-01-25

### Added
- Add support for nested lists in Markdown parsing.
- Add support for task list items, enabling ✅ lists to be rendered correctly.
- Add the ability to pass multiple Markdown files to the md command.

### Changed
- Improve rendering output to produce clearer formatting.

## [0.1.1] - 2026-01-23

### Added
- Add a helpful banner shown when the CLI starts
- Add responsive layout with a maximum width and padding to improve readability
- Add full markdown rendering support for files and input streams

### Changed
- Update ANSI handling so that wrapped lines inside code blocks keep correct styling
- Update Nerd Fonts processing for consistent icon display

### Fixed
- Fix layout width calculation on narrow screens
- Fix ANSI state reset when wrapping lines inside code blocks

## [0.1.0] - 2026-01-23

### Added
- Add a banner that displays on CLI start to welcome users.  
- Add automatic paging of output to view long markdown files in a pager when terminal height is exceeded.  
- Add responsive layout with a maximum width and padding to adapt markdown display to terminal size.  
- Add a streamlined markdown rendering pipeline for consistent formatting when using the CLI.  

### Improved
- Improve ANSI processing in code blocks to display colors correctly.  
- Improve theme system for easier customization of color schemes.  
- Improve layout handling of blockquotes, lists, and other elements for better wrapping and width handling.  
- Improve markdown rendering and code block formatting for cleaner output.  
- Improve support for Nerd Fonts to display icons and symbols correctly.  

### Fixed
- Fix ANSI state reset when wrapping code blocks so colors are shown properly.  
- Fix issues with Nerd Font rendering on supported terminals.

