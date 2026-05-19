---
description: markdown-display (md) - Beautiful terminal markdown viewer
globs: '*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json'
alwaysApply: false
---

# markdown-display

A terminal markdown viewer, short name `md`. Built with Bun and Effect v4.

## Effect Best Practices

Always consult effect-solutions before writing Effect code:

1. `effect-solutions list`
2. `effect-solutions show <topic>...`
3. Search `~/.local/share/effect-solutions/effect` for real implementations.

Never guess at Effect patterns.

## Windows Compatibility

The binary is named `md` on macOS/Linux but `mdown` on Windows to avoid conflict with the built-in Windows `md` (mkdir) command.

**Windows users:** Add a PowerShell alias to use `md`:

```powershell
Set-Alias md mdown
```

## Development

Default to using Bun instead of Node.js.

- `bun run dev` - Run CLI in development (`src/cli.ts`)
- `bun run build` - Bundle + tarball + formula (`scripts/build.ts`)
- `bun run build:bundle` - `dist/md.js` only (fast iteration)
- `bun run build:themes` - Regenerate theme files
- `bun run check` - Format + lint fix + typecheck
- `bun run lint` / `bun run format` - oxlint / oxfmt
- `bun run test` - `bun test`
- `bun run typecheck` / `bun run tc` - `tsc --noEmit`
- `just dev README.md` - convenience wrapper

Tooling matches `bun-cli-template`: oxfmt, oxlint (strict, type-aware), Effect language service.

## Project Structure

```
src/
├── cli.ts           # Effect CLI entry (BunRuntime.runMain)
├── cli/options.ts   # Effect CLI flags
├── index.ts         # Library exports
├── config/          # TOML config + Effect loaders
├── app/             # CLI orchestration (run-md, errors)
├── lib/             # Parser, render, pager, layout
└── ui/              # Themes, banner, picker
scripts/
├── build.ts         # dist bundle, tarball, formula, Windows zip
└── build-themes.ts
tests/               # bun:test suites
```

## Theme

Uses Catppuccin Frappé palette consistently with other CLI tools (aic, s3up, changelog, dots).

## Release

Bundled output is minified `dist/md.js` with `#!/usr/bin/env bun` (run via Bun; Homebrew formula uses `depends_on "bun"`).

```bash
aic release                      # full build (tarball + formula) — never --no-formula
aic publish                      # GitHub release + tap (see .aic)
just release                     # same as aic release
bun run build:bundle             # dist bundle only (dev)
```
