# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

