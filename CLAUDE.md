---
description: markdown-display (md) - Beautiful terminal markdown viewer
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

# markdown-display

A terminal markdown viewer, short name `md`.

## Windows Compatibility

The binary is named `md` on macOS/Linux but `mdown` on Windows to avoid conflict with the built-in Windows `md` (mkdir) command.

**Windows users:** Add a PowerShell alias to use `md`:
```powershell
Set-Alias md mdown
```

Or add to your PowerShell profile (`$PROFILE`):
```powershell
Set-Alias -Name md -Value mdown -Option AllScope
```

## Development

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

### Scripts

- `bun run dev` - Run in development
- `bun run build` - Build standalone binary
- `bun run lint` - Lint with Biome
- `bun run format` - Format with Biome
- `bun run check` - Lint + format check
- `bun run tc` - TypeScript type checking

## Bun APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- `Bun.$\`ls\`` instead of execa.

## Project Structure

```
src/
├── index.ts          # CLI entry point
├── lib/              # Core logic
└── ui/               # UI components
    ├── banner.ts     # ASCII banner
    └── theme.ts      # Catppuccin Frappe theme
```

## Theme

Uses Catppuccin Frappe palette consistently with other CLI tools (aic, s3up, changelog, dots).

## Release

Use `aic release` to build cross-platform binaries.
Use `aic publish` to create GitHub release and update Homebrew tap.
