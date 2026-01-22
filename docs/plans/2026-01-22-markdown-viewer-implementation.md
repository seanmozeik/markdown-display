# Markdown Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan. Dispatch parallel agents for independent tasks. **DEVIATION:** Agents do not have git access - orchestrator handles all commits after reviewing agent work.

**Goal:** Build a fast, beautiful terminal markdown pager that pipes to `less` with proper rendering of all markdown elements.

**Architecture:** CLI reads markdown → marked parses to AST → custom renderers transform each element to ANSI → output to pager or stdout based on TTY/height detection.

**Tech Stack:** Bun, TypeScript, marked (parsing), shiki (syntax highlighting), hyphen (text wrapping), picocolors (ANSI), boxen (boxes for code/tables), figlet + gradient-string (banner).

**Inspiration:** Key patterns borrowed from bat (pager logic, TTY detection) and glow (glamour rendering, width capping).

**Nerd Fonts:** Language icons for code blocks when detected (e.g.,  for TypeScript,  for Python). Graceful degradation to text labels when nerd fonts unavailable.

---

## Phase 0: Project Setup

### Task 0.1: Add Test Script and Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add test script to package.json**

Add `"test": "bun test"` to scripts section.

**Step 2: Install new dependencies**

Run: `bun add marked shiki hyphen console-table-printer`

Run: `bun remove @clack/prompts`

Note: Keep boxen, figlet, gradient-string for help/version banner and H1 headings.

**Step 3: Verify installation**

Run: `bun test`
Expected: "0 tests" or similar (no tests yet)

**Step 4: Orchestrator commits**

```
feat: add test runner and core dependencies
```

---

## Phase 1: Foundation (Parallel Group A)

These tasks have no dependencies on each other. **Dispatch as parallel agents.**

### Task 1.1: Width Detection Module

**Files:**
- Create: `src/lib/width.ts`
- Create: `src/lib/width.test.ts`

**Inspiration from glow:** Cap width at 120 for readability, fall back to 80.

**Step 1: Write the failing test**

```typescript
// src/lib/width.test.ts
import { describe, expect, test, afterEach } from 'bun:test'
import { getTerminalWidth } from './width'

describe('getTerminalWidth', () => {
  const originalColumns = process.stdout.columns

  afterEach(() => {
    Object.defineProperty(process.stdout, 'columns', { value: originalColumns, writable: true })
  })

  test('returns terminal width when available', () => {
    Object.defineProperty(process.stdout, 'columns', { value: 100, writable: true })
    expect(getTerminalWidth()).toBe(100)
  })

  test('returns default 80 when columns undefined', () => {
    Object.defineProperty(process.stdout, 'columns', { value: undefined, writable: true })
    expect(getTerminalWidth()).toBe(80)
  })

  test('respects override parameter', () => {
    Object.defineProperty(process.stdout, 'columns', { value: 120, writable: true })
    expect(getTerminalWidth(60)).toBe(60)
  })

  test('clamps width to minimum 40', () => {
    expect(getTerminalWidth(20)).toBe(40)
  })

  test('caps width at 120 for readability (glow pattern)', () => {
    Object.defineProperty(process.stdout, 'columns', { value: 200, writable: true })
    expect(getTerminalWidth()).toBe(120)
  })

  test('override can exceed 120 if explicit', () => {
    expect(getTerminalWidth(150)).toBe(150)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/width.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/width.ts
const MIN_WIDTH = 40
const MAX_AUTO_WIDTH = 120 // Cap for readability (from glow)
const DEFAULT_WIDTH = 80

export function getTerminalWidth(override?: number): number {
  if (override !== undefined) {
    return Math.max(MIN_WIDTH, override)
  }

  const detected = process.stdout.columns ?? DEFAULT_WIDTH
  return Math.max(MIN_WIDTH, Math.min(MAX_AUTO_WIDTH, detected))
}

export function getTerminalHeight(): number {
  return process.stdout.rows ?? 24
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/width.test.ts`
Expected: PASS (6 tests)

---

### Task 1.2: Config Module

**Files:**
- Create: `src/lib/config.ts`
- Create: `src/lib/config.test.ts`
- Create: `src/lib/default-config.toml`

**Step 1: Write the failing test**

```typescript
// src/lib/config.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'bun:test'
import { loadConfig, type Config, DEFAULT_CONFIG } from './config'
import { unlink, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

describe('loadConfig', () => {
  const testConfigDir = '/tmp/md-test-config'
  const testConfigPath = join(testConfigDir, 'config.toml')

  beforeEach(async () => {
    await mkdir(testConfigDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await unlink(testConfigPath)
    } catch {}
  })

  test('returns default config when no user config exists', async () => {
    const config = await loadConfig('/nonexistent/path')
    expect(config.theme).toBe('frappe')
    expect(config.width).toBe('auto')
    expect(config.code.wrap).toBe(true)
  })

  test('merges user config with defaults', async () => {
    await Bun.write(testConfigPath, 'theme = "mocha"\nwidth = 100')
    const config = await loadConfig(testConfigPath)
    expect(config.theme).toBe('mocha')
    expect(config.width).toBe(100)
    expect(config.code.wrap).toBe(true) // default preserved
  })

  test('deeply merges nested config', async () => {
    await Bun.write(testConfigPath, '[code]\nwrap = false')
    const config = await loadConfig(testConfigPath)
    expect(config.code.wrap).toBe(false)
    expect(config.code.continuation).toBe('↪') // default preserved
  })
})

describe('DEFAULT_CONFIG', () => {
  test('has expected structure', () => {
    expect(DEFAULT_CONFIG.theme).toBe('frappe')
    expect(DEFAULT_CONFIG.code.theme).toBe('catppuccin-frappe')
    expect(DEFAULT_CONFIG.text.hyphenation).toBe(true)
    expect(DEFAULT_CONFIG.links.osc8).toBe('auto')
    expect(DEFAULT_CONFIG.pager.args).toContain('-R')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/config.test.ts`
Expected: FAIL - cannot find module

**Step 3: Create default config TOML**

```toml
# src/lib/default-config.toml
theme = "frappe"
width = "auto"
nerd_fonts = "auto"  # "auto" | true | false

[code]
wrap = true
continuation = "↪"
theme = "catppuccin-frappe"

[text]
hyphenation = true
locale = "en-us"

[links]
osc8 = "auto"
show_urls = false

[pager]
command = ""
args = ["-R", "-F", "-K", "-X"]
```

**Step 4: Write minimal implementation**

```typescript
// src/lib/config.ts
import defaultToml from './default-config.toml'

export interface Config {
  theme: string
  width: 'auto' | number
  nerd_fonts: 'auto' | boolean
  code: {
    wrap: boolean
    continuation: string
    theme: string
  }
  text: {
    hyphenation: boolean
    locale: string
  }
  links: {
    osc8: 'auto' | boolean
    show_urls: boolean
  }
  pager: {
    command: string
    args: string[]
  }
}

export const DEFAULT_CONFIG: Config = defaultToml as Config

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key in source) {
    const sourceVal = source[key]
    const targetVal = target[key]
    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      ) as T[Extract<keyof T, string>]
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal as T[Extract<keyof T, string>]
    }
  }
  return result
}

export async function loadConfig(configPath: string): Promise<Config> {
  const file = Bun.file(configPath)
  const exists = await file.exists()

  if (!exists) {
    return DEFAULT_CONFIG
  }

  const content = await file.text()
  const parsed = await import('bun').then(b => b.TOML.parse(content))
  return deepMerge(DEFAULT_CONFIG, parsed as Partial<Config>)
}

export function getConfigPath(): string {
  const xdgConfig = Bun.env.XDG_CONFIG_HOME ?? `${Bun.env.HOME}/.config`
  return `${xdgConfig}/md/config.toml`
}
```

**Step 5: Run test to verify it passes**

Run: `bun test src/lib/config.test.ts`
Expected: PASS (4 tests)

---

### Task 1.3: Pager Module

**Files:**
- Create: `src/lib/pager.ts`
- Create: `src/lib/pager.test.ts`

**Inspiration from bat:**
- Three-state paging: Always/QuitIfOneScreen/Never
- Check both stdin AND stdout TTY
- Inject `-R -F -K` into less
- Respect `NO_COLOR` env var
- Set `LESSCHARSET=UTF-8`

**Step 1: Write the failing test**

```typescript
// src/lib/pager.test.ts
import { describe, expect, test, afterEach } from 'bun:test'
import { shouldUsePager, getPagerCommand, countLines, PagingMode } from './pager'

describe('shouldUsePager', () => {
  test('returns Never when stdout is not TTY', () => {
    expect(shouldUsePager({ stdoutTTY: false, stdinTTY: true, lines: 100, height: 50 }))
      .toBe(PagingMode.Never)
  })

  test('returns Never when content fits in terminal', () => {
    expect(shouldUsePager({ stdoutTTY: true, stdinTTY: true, lines: 10, height: 50 }))
      .toBe(PagingMode.Never)
  })

  test('returns QuitIfOneScreen when content exceeds height', () => {
    expect(shouldUsePager({ stdoutTTY: true, stdinTTY: true, lines: 100, height: 50 }))
      .toBe(PagingMode.QuitIfOneScreen)
  })

  test('returns Never when noPager flag is true', () => {
    expect(shouldUsePager({ stdoutTTY: true, stdinTTY: true, lines: 100, height: 50, noPager: true }))
      .toBe(PagingMode.Never)
  })

  test('returns QuitIfOneScreen for piped stdin with TTY stdout (bat pattern)', () => {
    expect(shouldUsePager({ stdoutTTY: true, stdinTTY: false, lines: 100, height: 50 }))
      .toBe(PagingMode.QuitIfOneScreen)
  })
})

describe('getPagerCommand', () => {
  const originalPager = Bun.env.PAGER
  const originalMdPager = Bun.env.MD_PAGER

  afterEach(() => {
    if (originalPager) Bun.env.PAGER = originalPager
    else delete Bun.env.PAGER
    if (originalMdPager) Bun.env.MD_PAGER = originalMdPager
    else delete Bun.env.MD_PAGER
  })

  test('uses config command if provided', () => {
    const result = getPagerCommand({ command: 'more', args: [] })
    expect(result.command).toBe('more')
  })

  test('uses MD_PAGER over PAGER (bat pattern)', () => {
    Bun.env.MD_PAGER = 'most'
    Bun.env.PAGER = 'less'
    const result = getPagerCommand({ command: '', args: ['-R'] })
    expect(result.command).toBe('most')
  })

  test('uses PAGER if no MD_PAGER', () => {
    delete Bun.env.MD_PAGER
    Bun.env.PAGER = 'most'
    const result = getPagerCommand({ command: '', args: ['-R'] })
    expect(result.command).toBe('most')
  })

  test('defaults to less with smart args', () => {
    delete Bun.env.PAGER
    delete Bun.env.MD_PAGER
    const result = getPagerCommand({ command: '', args: [] })
    expect(result.command).toBe('less')
    expect(result.args).toContain('-R') // raw ANSI
  })
})

describe('countLines', () => {
  test('counts newlines in string', () => {
    expect(countLines('line1\nline2\nline3')).toBe(3)
  })

  test('handles empty string', () => {
    expect(countLines('')).toBe(1)
  })

  test('accounts for wrapped lines when width provided', () => {
    const longLine = 'a'.repeat(100)
    expect(countLines(longLine, 50)).toBe(2)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/pager.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/pager.ts
export enum PagingMode {
  Always = 'always',
  QuitIfOneScreen = 'quit-if-one-screen',
  Never = 'never'
}

interface PagerConfig {
  command: string
  args: string[]
}

interface PagingContext {
  stdoutTTY: boolean
  stdinTTY: boolean
  lines: number
  height: number
  noPager?: boolean
  forceAlways?: boolean
}

export function shouldUsePager(ctx: PagingContext): PagingMode {
  if (ctx.noPager || !ctx.stdoutTTY) {
    return PagingMode.Never
  }

  if (ctx.forceAlways) {
    return PagingMode.Always
  }

  // Content fits on screen
  if (ctx.lines <= ctx.height) {
    return PagingMode.Never
  }

  return PagingMode.QuitIfOneScreen
}

export function getPagerCommand(config: PagerConfig): { command: string; args: string[]; env: Record<string, string> } {
  // Priority: config > MD_PAGER > PAGER > less (bat pattern)
  const command = config.command || Bun.env.MD_PAGER || Bun.env.PAGER || 'less'

  // For less, inject smart defaults if no args configured
  let args = config.args
  if (command === 'less' && args.length === 0) {
    args = ['-R', '-F', '-K', '-X'] // Raw ANSI, quit-if-one-screen, quit-on-interrupt, no-init
  }

  return {
    command,
    args,
    env: { LESSCHARSET: 'UTF-8' } // Ensure UTF-8 (bat pattern)
  }
}

export function countLines(content: string, width?: number): number {
  if (!content) return 1

  const lines = content.split('\n')

  if (!width) return lines.length

  let total = 0
  for (const line of lines) {
    const visibleLength = stripAnsi(line).length
    total += Math.max(1, Math.ceil(visibleLength / width))
  }
  return total
}

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

export async function pipeToLess(
  content: string,
  config: PagerConfig
): Promise<void> {
  const { command, args, env } = getPagerCommand(config)

  const proc = Bun.spawn([command, ...args], {
    stdin: 'pipe',
    stdout: 'inherit',
    stderr: 'inherit',
    env: { ...process.env, ...env }
  })

  proc.stdin.write(content)
  proc.stdin.end()

  await proc.exited
}

export function shouldUseColor(): boolean {
  // Respect NO_COLOR standard (bat pattern)
  if (Bun.env.NO_COLOR !== undefined) {
    return false
  }
  return process.stdout.isTTY ?? false
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/pager.test.ts`
Expected: PASS (10 tests)

---

### Task 1.4: Nerd Font Detection and Icons

**Files:**
- Create: `src/lib/icons.ts`
- Create: `src/lib/icons.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/icons.test.ts
import { describe, expect, test, afterEach } from 'bun:test'
import { getLanguageIcon, supportsNerdFonts, LANGUAGE_ICONS } from './icons'

describe('supportsNerdFonts', () => {
  const originalTermProgram = Bun.env.TERM_PROGRAM
  const originalNerdFont = Bun.env.NERD_FONTS

  afterEach(() => {
    if (originalTermProgram) Bun.env.TERM_PROGRAM = originalTermProgram
    else delete Bun.env.TERM_PROGRAM
    if (originalNerdFont) Bun.env.NERD_FONTS = originalNerdFont
    else delete Bun.env.NERD_FONTS
  })

  test('returns true when NERD_FONTS env is set', () => {
    Bun.env.NERD_FONTS = '1'
    expect(supportsNerdFonts()).toBe(true)
  })

  test('returns true for known nerd font terminals', () => {
    delete Bun.env.NERD_FONTS
    for (const term of ['WezTerm', 'kitty']) {
      Bun.env.TERM_PROGRAM = term
      expect(supportsNerdFonts()).toBe(true)
    }
  })

  test('returns false for unknown terminals without env override', () => {
    delete Bun.env.NERD_FONTS
    Bun.env.TERM_PROGRAM = 'unknown'
    expect(supportsNerdFonts()).toBe(false)
  })
})

describe('getLanguageIcon', () => {
  test('returns icon for known languages', () => {
    expect(getLanguageIcon('typescript', true)).toBe('󰛑')
    expect(getLanguageIcon('python', true)).toBe('')
    expect(getLanguageIcon('rust', true)).toBe('')
  })

  test('returns text label when nerd fonts disabled', () => {
    expect(getLanguageIcon('typescript', false)).toBe('ts')
    expect(getLanguageIcon('python', false)).toBe('py')
  })

  test('handles language aliases', () => {
    expect(getLanguageIcon('ts', true)).toBe('󰛑')
    expect(getLanguageIcon('js', true)).toBe('')
    expect(getLanguageIcon('py', true)).toBe('')
  })

  test('returns empty string for unknown languages', () => {
    expect(getLanguageIcon('unknown-lang', true)).toBe('')
    expect(getLanguageIcon('unknown-lang', false)).toBe('')
  })
})

describe('LANGUAGE_ICONS', () => {
  test('has icons for common languages', () => {
    const expected = ['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c', 'cpp', 'ruby', 'php', 'swift', 'kotlin', 'lua', 'bash', 'json', 'yaml', 'markdown', 'html', 'css', 'sql']
    for (const lang of expected) {
      expect(LANGUAGE_ICONS[lang]).toBeDefined()
    }
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/icons.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/icons.ts

// Nerd Font icons for programming languages (from nvim-web-devicons)
export const LANGUAGE_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  typescript: { icon: '󰛑', label: 'ts', color: '#519ABA' },
  javascript: { icon: '', label: 'js', color: '#CBCB41' },
  python: { icon: '', label: 'py', color: '#FFBC03' },
  rust: { icon: '', label: 'rs', color: '#DEA584' },
  go: { icon: '', label: 'go', color: '#00ADD8' },
  java: { icon: '', label: 'java', color: '#CC3E44' },
  c: { icon: '', label: 'c', color: '#599EFF' },
  cpp: { icon: '', label: 'cpp', color: '#519ABA' },
  ruby: { icon: '', label: 'rb', color: '#701516' },
  php: { icon: '', label: 'php', color: '#A074C4' },
  swift: { icon: '', label: 'swift', color: '#E37933' },
  kotlin: { icon: '', label: 'kt', color: '#7F52FF' },
  csharp: { icon: '󰌛', label: 'cs', color: '#596706' },
  lua: { icon: '', label: 'lua', color: '#51A0CF' },
  bash: { icon: '', label: 'sh', color: '#4D5A5E' },
  shell: { icon: '', label: 'sh', color: '#4D5A5E' },
  json: { icon: '', label: 'json', color: '#CBCB41' },
  yaml: { icon: '', label: 'yaml', color: '#6D8086' },
  toml: { icon: '', label: 'toml', color: '#6D8086' },
  markdown: { icon: '', label: 'md', color: '#DDDDDD' },
  html: { icon: '', label: 'html', color: '#E44D26' },
  css: { icon: '', label: 'css', color: '#663399' },
  scss: { icon: '', label: 'scss', color: '#CB6698' },
  sql: { icon: '', label: 'sql', color: '#DAD8D8' },
  graphql: { icon: '', label: 'gql', color: '#E535AB' },
  docker: { icon: '', label: 'docker', color: '#2496ED' },
  dockerfile: { icon: '', label: 'docker', color: '#2496ED' },
  vue: { icon: '', label: 'vue', color: '#41B883' },
  react: { icon: '', label: 'jsx', color: '#61DAFB' },
  svelte: { icon: '', label: 'svelte', color: '#FF3E00' },
  elixir: { icon: '', label: 'ex', color: '#6E4A7E' },
  erlang: { icon: '', label: 'erl', color: '#A90533' },
  haskell: { icon: '', label: 'hs', color: '#5E5086' },
  ocaml: { icon: '', label: 'ml', color: '#E98407' },
  scala: { icon: '', label: 'scala', color: '#DC322F' },
  clojure: { icon: '', label: 'clj', color: '#8DC149' },
  zig: { icon: '', label: 'zig', color: '#F7A41D' },
  nim: { icon: '', label: 'nim', color: '#FFE953' },
  julia: { icon: '', label: 'jl', color: '#9558B2' },
  r: { icon: '', label: 'r', color: '#276DC3' },
  perl: { icon: '', label: 'pl', color: '#39457E' },
  vim: { icon: '', label: 'vim', color: '#019833' },
  tex: { icon: '', label: 'tex', color: '#3D6117' },
  makefile: { icon: '', label: 'make', color: '#6D8086' },
  cmake: { icon: '', label: 'cmake', color: '#6D8086' },
  nginx: { icon: '', label: 'nginx', color: '#009639' },
  xml: { icon: '󰗀', label: 'xml', color: '#E37933' },
  csv: { icon: '', label: 'csv', color: '#89E051' },
  diff: { icon: '', label: 'diff', color: '#41535B' },
  git: { icon: '', label: 'git', color: '#F14C28' },
  prisma: { icon: '', label: 'prisma', color: '#5A67D8' },
}

// Aliases for common short names
const LANG_ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  sh: 'bash',
  zsh: 'bash',
  fish: 'bash',
  yml: 'yaml',
  md: 'markdown',
  cs: 'csharp',
  kt: 'kotlin',
  hs: 'haskell',
  ml: 'ocaml',
  ex: 'elixir',
  exs: 'elixir',
  erl: 'erlang',
  jl: 'julia',
  pl: 'perl',
  h: 'c',
  hpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
}

// Terminals known to typically have nerd fonts installed
const NERD_FONT_TERMINALS = ['WezTerm', 'kitty', 'Alacritty']

export function supportsNerdFonts(): boolean {
  // Explicit override via env var
  if (Bun.env.NERD_FONTS === '1' || Bun.env.NERD_FONTS === 'true') {
    return true
  }
  if (Bun.env.NERD_FONTS === '0' || Bun.env.NERD_FONTS === 'false') {
    return false
  }

  // Auto-detect based on terminal
  const term = Bun.env.TERM_PROGRAM ?? ''
  return NERD_FONT_TERMINALS.some((t) => term.includes(t))
}

export function getLanguageIcon(lang: string, useNerdFonts: boolean): string {
  const normalized = LANG_ALIASES[lang.toLowerCase()] ?? lang.toLowerCase()
  const entry = LANGUAGE_ICONS[normalized]

  if (!entry) return ''

  return useNerdFonts ? entry.icon : entry.label
}

export function getLanguageColor(lang: string): string | undefined {
  const normalized = LANG_ALIASES[lang.toLowerCase()] ?? lang.toLowerCase()
  return LANGUAGE_ICONS[normalized]?.color
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/icons.test.ts`
Expected: PASS (8 tests)

---

## Phase 2: Element Renderers (Parallel Group B)

These tasks depend on Phase 1 completion. Each element renderer is independent. **Dispatch as parallel agents.**

### Task 2.1: Heading Renderer (H1 in Boxen)

**Files:**
- Create: `src/lib/elements/heading.ts`
- Create: `src/lib/elements/heading.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/elements/heading.test.ts
import { describe, expect, test } from 'bun:test'
import { renderHeading } from './heading'

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

describe('renderHeading', () => {
  test('h1 renders in boxen container', () => {
    const result = renderHeading('Title', 1, 40)
    expect(result).toContain('Title')
    // Boxen uses box-drawing characters
    expect(result).toMatch(/[╭╮╯╰│─]/)
  })

  test('h2 has line decoration', () => {
    const result = renderHeading('Subtitle', 2, 40)
    expect(result).toContain('Subtitle')
    expect(result).toContain('─')
  })

  test('h3+ has no line decoration', () => {
    const result = renderHeading('Section', 3, 40)
    expect(result).toContain('Section')
    // Should not have boxen or line decoration
    expect(result).not.toMatch(/[╭╮╯╰]/)
  })

  test('adds appropriate vertical spacing', () => {
    const result = renderHeading('Title', 1, 40)
    expect(result.startsWith('\n')).toBe(true)
    expect(result.endsWith('\n')).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/elements/heading.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/elements/heading.ts
import boxen from 'boxen'
import { frappe } from '../../ui/theme'

export function renderHeading(text: string, level: number, width: number): string {
  const cleanText = text.trim()

  switch (level) {
    case 1: {
      // H1 gets a prominent boxen container
      const boxed = boxen(frappe.text(cleanText), {
        padding: { left: 2, right: 2, top: 0, bottom: 0 },
        borderColor: '#ca9ee6', // frappe.mauve
        borderStyle: 'round',
        textAlignment: 'center',
        width: Math.min(width, cleanText.length + 8)
      })
      return `\n\n${boxed}\n\n`
    }
    case 2: {
      const lineLength = Math.max(0, width - cleanText.length - 2)
      const line = frappe.surface2('─'.repeat(lineLength))
      return `\n${frappe.lavender(cleanText)} ${line}\n`
    }
    default: {
      const color = level === 3 ? frappe.blue : level === 4 ? frappe.teal : frappe.subtext1
      return `\n${color(cleanText)}\n`
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/elements/heading.test.ts`
Expected: PASS (4 tests)

---

### Task 2.2: Link Renderer

**Files:**
- Create: `src/lib/elements/link.ts`
- Create: `src/lib/elements/link.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/elements/link.test.ts
import { describe, expect, test, afterEach } from 'bun:test'
import { renderLink, supportsOsc8 } from './link'

describe('renderLink', () => {
  test('renders OSC 8 hyperlink when enabled', () => {
    const result = renderLink('Click here', 'https://example.com', { osc8: true, show_urls: false })
    expect(result).toContain('\x1b]8;;https://example.com\x07')
    expect(result).toContain('Click here')
    expect(result).toContain('\x1b]8;;\x07')
  })

  test('renders plain link with URL when OSC 8 disabled', () => {
    const result = renderLink('Click here', 'https://example.com', { osc8: false, show_urls: false })
    expect(result).not.toContain('\x1b]8;;')
    expect(result).toContain('Click here')
    expect(result).toContain('https://example.com')
  })

  test('handles link with same text and URL', () => {
    const result = renderLink('https://example.com', 'https://example.com', { osc8: false, show_urls: false })
    const urlCount = (result.match(/example\.com/g) || []).length
    expect(urlCount).toBe(1)
  })
})

describe('supportsOsc8', () => {
  const originalTermProgram = Bun.env.TERM_PROGRAM

  afterEach(() => {
    if (originalTermProgram) Bun.env.TERM_PROGRAM = originalTermProgram
    else delete Bun.env.TERM_PROGRAM
  })

  test('returns true for known supporting terminals', () => {
    for (const term of ['iTerm.app', 'WezTerm', 'vscode']) {
      Bun.env.TERM_PROGRAM = term
      expect(supportsOsc8()).toBe(true)
    }
  })

  test('returns false for unknown terminals', () => {
    Bun.env.TERM_PROGRAM = 'unknown-terminal'
    expect(supportsOsc8()).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/elements/link.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/elements/link.ts
import { frappe } from '../../ui/theme'

interface LinkConfig {
  osc8: 'auto' | boolean
  show_urls: boolean
}

const OSC8_TERMINALS = ['iTerm.app', 'WezTerm', 'vscode', 'Hyper', 'kitty', 'Alacritty']

export function supportsOsc8(): boolean {
  const term = Bun.env.TERM_PROGRAM ?? ''
  return OSC8_TERMINALS.some((t) => term.includes(t))
}

export function renderLink(text: string, url: string, config: LinkConfig): string {
  const useOsc8 = config.osc8 === true || (config.osc8 === 'auto' && supportsOsc8())
  const textAndUrlSame = text === url

  if (useOsc8) {
    const hyperlink = `\x1b]8;;${url}\x07${frappe.blue(text)}\x1b]8;;\x07`
    if (config.show_urls && !textAndUrlSame) {
      return `${hyperlink} ${frappe.surface2(`(${url})`)}`
    }
    return hyperlink
  }

  if (textAndUrlSame) {
    return frappe.blue(url)
  }
  return `${frappe.blue(text)} ${frappe.surface2(`(${url})`)}`
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/elements/link.test.ts`
Expected: PASS (5 tests)

---

### Task 2.3: List Renderer

**Files:**
- Create: `src/lib/elements/list.ts`
- Create: `src/lib/elements/list.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/elements/list.test.ts
import { describe, expect, test } from 'bun:test'
import { renderList, renderListItem } from './list'

describe('renderListItem', () => {
  test('renders bullet item with bullet character', () => {
    const result = renderListItem('Item text', false, 0)
    expect(result).toContain('•')
    expect(result).toContain('Item text')
  })

  test('renders ordered item with number', () => {
    const result = renderListItem('Item text', true, 0, 1)
    expect(result).toContain('1.')
    expect(result).toContain('Item text')
  })

  test('indents nested items', () => {
    const depth0 = renderListItem('Top', false, 0)
    const depth1 = renderListItem('Nested', false, 1)

    const indent0 = depth0.match(/^(\s*)/)?.[1].length ?? 0
    const indent1 = depth1.match(/^(\s*)/)?.[1].length ?? 0

    expect(indent1).toBeGreaterThan(indent0)
  })
})

describe('renderList', () => {
  test('renders unordered list', () => {
    const items = ['First', 'Second', 'Third']
    const result = renderList(items, false)

    expect(result).toContain('•')
    expect(result).toContain('First')
    expect(result).toContain('Second')
  })

  test('renders ordered list with sequential numbers', () => {
    const items = ['First', 'Second', 'Third']
    const result = renderList(items, true)

    expect(result).toContain('1.')
    expect(result).toContain('2.')
    expect(result).toContain('3.')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/elements/list.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/elements/list.ts
import { frappe } from '../../ui/theme'

const INDENT_SIZE = 3
const BULLETS = ['•', '◦', '▪']

export function renderListItem(
  text: string,
  ordered: boolean,
  depth: number,
  index?: number
): string {
  const indent = ' '.repeat(depth * INDENT_SIZE)
  const bullet = ordered ? `${index ?? 1}.` : BULLETS[depth % BULLETS.length]

  return `${indent}${frappe.mauve(bullet)} ${text}`
}

export function renderList(items: string[], ordered: boolean, depth = 0): string {
  return items
    .map((item, i) => renderListItem(item, ordered, depth, i + 1))
    .join('\n')
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/elements/list.test.ts`
Expected: PASS (5 tests)

---

### Task 2.4: Blockquote Renderer

**Files:**
- Create: `src/lib/elements/blockquote.ts`
- Create: `src/lib/elements/blockquote.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/elements/blockquote.test.ts
import { describe, expect, test } from 'bun:test'
import { renderBlockquote } from './blockquote'

describe('renderBlockquote', () => {
  test('adds vertical bar prefix to each line', () => {
    const result = renderBlockquote('Quote text')
    expect(result).toContain('│')
  })

  test('handles multiline quotes', () => {
    const result = renderBlockquote('Line 1\nLine 2\nLine 3')
    const barCount = (result.match(/│/g) || []).length
    expect(barCount).toBe(3)
  })

  test('applies quote styling', () => {
    const result = renderBlockquote('Styled quote')
    expect(result).toContain('\x1b[')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/elements/blockquote.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/elements/blockquote.ts
import { frappe } from '../../ui/theme'

export function renderBlockquote(text: string, depth = 1): string {
  const prefix = frappe.surface2('│ '.repeat(depth))
  const lines = text.split('\n')

  return lines.map((line) => `${prefix}${frappe.overlay1(line)}`).join('\n')
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/elements/blockquote.test.ts`
Expected: PASS (3 tests)

---

### Task 2.5: Table Renderer (using console-table-printer)

**Files:**
- Create: `src/lib/elements/table.ts`
- Create: `src/lib/elements/table.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/elements/table.test.ts
import { describe, expect, test } from 'bun:test'
import { renderTable } from './table'

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

describe('renderTable', () => {
  test('renders table with proper grid borders', () => {
    const result = renderTable(['Col1', 'Col2'], [['A', 'B']])

    // console-table-printer uses box-drawing characters
    expect(result).toContain('┌')
    expect(result).toContain('┐')
    expect(result).toContain('└')
    expect(result).toContain('┘')
    expect(result).toContain('│')
  })

  test('renders header row', () => {
    const result = renderTable(['Name', 'Age'], [['Alice', '30']])
    expect(result).toContain('Name')
    expect(result).toContain('Age')
  })

  test('renders data rows', () => {
    const result = renderTable(['H'], [['R1'], ['R2'], ['R3']])
    expect(result).toContain('R1')
    expect(result).toContain('R2')
    expect(result).toContain('R3')
  })

  test('handles empty table', () => {
    const result = renderTable(['A', 'B'], [])
    expect(result).toContain('A')
    expect(result).toContain('B')
  })

  test('aligns columns properly', () => {
    const result = renderTable(['Name', 'Value'], [['Short', 'X'], ['Much Longer Name', 'Y']])
    // All rows should be aligned
    const lines = stripAnsi(result).split('\n').filter(l => l.includes('│'))
    const lengths = lines.map(l => l.length)
    expect(new Set(lengths).size).toBe(1) // All same length
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/elements/table.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/elements/table.ts
import { Table } from 'console-table-printer'

// Catppuccin Frappe colors for table styling
const TABLE_STYLE = {
  headerTop: { left: '┌', mid: '┬', right: '┐', other: '─' },
  headerBottom: { left: '├', mid: '┼', right: '┤', other: '─' },
  tableBottom: { left: '└', mid: '┴', right: '┘', other: '─' },
  vertical: '│'
}

const HEADER_COLOR = 'white_bold'
const ROW_COLOR = 'white'
const BORDER_COLOR = 'gray'

export function renderTable(headers: string[], rows: string[][]): string {
  const table = new Table({
    columns: headers.map((header) => ({
      name: header,
      alignment: 'left',
      color: ROW_COLOR
    })),
    style: {
      headerTop: TABLE_STYLE.headerTop,
      headerBottom: TABLE_STYLE.headerBottom,
      tableBottom: TABLE_STYLE.tableBottom,
      vertical: TABLE_STYLE.vertical
    },
    colorMap: {
      custom_header: '\x1b[38;5;189m\x1b[1m', // frappe.text + bold
      custom_row: '\x1b[38;5;146m'             // frappe.subtext1
    }
  })

  // Add rows as objects
  for (const row of rows) {
    const rowObj: Record<string, string> = {}
    headers.forEach((header, i) => {
      rowObj[header] = row[i] ?? ''
    })
    table.addRow(rowObj, { color: 'custom_row' })
  }

  return table.render()
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/elements/table.test.ts`
Expected: PASS (5 tests)

---

### Task 2.6: Text Renderer (with Hyphenation)

**Files:**
- Create: `src/lib/elements/text.ts`
- Create: `src/lib/elements/text.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/elements/text.test.ts
import { describe, expect, test } from 'bun:test'
import { wrapText, renderText } from './text'

describe('wrapText', () => {
  test('wraps text at word boundaries', () => {
    const text = 'This is a long sentence that should wrap'
    const result = wrapText(text, 20)
    const lines = result.split('\n')

    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(20)
    }
  })

  test('preserves short lines', () => {
    const text = 'Short'
    const result = wrapText(text, 80)
    expect(result).toBe('Short')
  })
})

describe('renderText', () => {
  test('renders paragraph with proper styling', () => {
    const result = renderText('Hello world', { width: 80, hyphenation: false })
    expect(result).toContain('Hello world')
  })

  test('applies text color', () => {
    const result = renderText('Colored', { width: 80, hyphenation: false })
    expect(result).toContain('\x1b[')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/elements/text.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/elements/text.ts
import { frappe } from '../../ui/theme'

interface TextConfig {
  width: number
  hyphenation: boolean
  locale?: string
}

export function wrapText(text: string, width: number): string {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word

    if (testLine.length <= width) {
      currentLine = testLine
    } else if (currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      lines.push(word.slice(0, width))
      currentLine = word.slice(width)
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.join('\n')
}

export function renderText(text: string, config: TextConfig): string {
  const wrapped = wrapText(text, config.width)
  return `${frappe.subtext1(wrapped)}\n`
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/elements/text.test.ts`
Expected: PASS (4 tests)

---

### Task 2.7: Code Block Renderer (Shiki + Boxen + Nerd Fonts)

**Files:**
- Create: `src/lib/elements/code.ts`
- Create: `src/lib/elements/code.test.ts`

**Features:**
- Shiki syntax highlighting with expanded language support
- Boxen for code block borders
- Nerd font language icons (with text label graceful degradation)
- Skip highlighting lines >16KB (bat pattern)

**Step 1: Write the failing test**

```typescript
// src/lib/elements/code.test.ts
import { describe, expect, test } from 'bun:test'
import { renderCodeBlock, renderInlineCode, wrapCodeLines } from './code'

describe('wrapCodeLines', () => {
  test('wraps long lines with continuation marker', () => {
    const code = 'x'.repeat(100)
    const result = wrapCodeLines(code, 50, '↪')

    expect(result).toContain('↪')
    const lines = result.split('\n')
    expect(lines.length).toBeGreaterThan(1)
  })

  test('preserves short lines', () => {
    const code = 'short line'
    const result = wrapCodeLines(code, 80, '↪')
    expect(result).toBe('short line')
  })
})

describe('renderInlineCode', () => {
  test('applies inline code styling', () => {
    const result = renderInlineCode('const x = 1')
    expect(result).toContain('\x1b[')
    expect(result).toContain('const x = 1')
  })
})

describe('renderCodeBlock', () => {
  test('renders code in boxen container', async () => {
    const result = await renderCodeBlock('const x = 1', 'ts', {
      width: 60,
      wrap: true,
      continuation: '↪',
      theme: 'catppuccin-frappe',
      useNerdFonts: false
    })

    expect(result).toContain('const')
    // Boxen uses box-drawing characters
    expect(result).toMatch(/[┌┐└┘│─╭╮╯╰]/)
  })

  test('includes language label in header', async () => {
    const result = await renderCodeBlock('print("hi")', 'python', {
      width: 60,
      wrap: true,
      continuation: '↪',
      theme: 'catppuccin-frappe',
      useNerdFonts: false
    })

    expect(result).toContain('py') // text label when nerd fonts disabled
  })

  test('handles unknown language gracefully', async () => {
    const result = await renderCodeBlock('some code', 'unknown-lang', {
      width: 60,
      wrap: true,
      continuation: '↪',
      theme: 'catppuccin-frappe',
      useNerdFonts: false
    })

    expect(result).toContain('some code')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/elements/code.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/elements/code.ts
import boxen from 'boxen'
import { frappe } from '../../ui/theme'
import { getLanguageIcon, supportsNerdFonts } from '../icons'

interface CodeConfig {
  width: number
  wrap: boolean
  continuation: string
  theme: string
  useNerdFonts?: boolean
}

// Lazy-loaded shiki instance
let highlighter: Awaited<ReturnType<typeof import('shiki').createHighlighter>> | null = null

const MAX_LINE_LENGTH = 16 * 1024 // Skip highlighting very long lines (bat pattern)

// Expanded language list - shiki bundles these grammars
const SUPPORTED_LANGS = [
  // Core languages
  'typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c', 'cpp',
  'csharp', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'lua', 'perl',
  // Shell
  'bash', 'shell', 'zsh', 'fish', 'powershell',
  // Web
  'html', 'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'jsx', 'tsx',
  // Data formats
  'json', 'yaml', 'toml', 'xml', 'csv',
  // Markup
  'markdown', 'latex', 'tex',
  // Config
  'dockerfile', 'nginx', 'apache', 'ini', 'env',
  // Database
  'sql', 'plsql', 'graphql', 'prisma',
  // Functional
  'haskell', 'ocaml', 'fsharp', 'elixir', 'erlang', 'clojure', 'lisp', 'scheme',
  // Systems
  'zig', 'nim', 'crystal', 'julia', 'r', 'matlab',
  // Other
  'vim', 'diff', 'git-commit', 'git-rebase', 'makefile', 'cmake', 'regex',
  'http', 'jsonc', 'jsonl', 'wasm'
]

async function getHighlighter(theme: string) {
  if (highlighter) return highlighter

  const { createHighlighter } = await import('shiki')
  highlighter = await createHighlighter({
    themes: [theme],
    langs: SUPPORTED_LANGS
  })
  return highlighter
}

export function wrapCodeLines(code: string, width: number, continuation: string): string {
  const lines = code.split('\n')
  const wrapped: string[] = []

  for (const line of lines) {
    if (line.length <= width) {
      wrapped.push(line)
    } else {
      let remaining = line
      let first = true
      while (remaining.length > 0) {
        const chunkWidth = first ? width : width - continuation.length - 1
        const chunk = remaining.slice(0, chunkWidth)
        remaining = remaining.slice(chunkWidth)

        if (!first) {
          wrapped.push(`${frappe.surface2(continuation)} ${chunk}`)
        } else {
          wrapped.push(chunk)
        }
        first = false
      }
    }
  }

  return wrapped.join('\n')
}

export function renderInlineCode(code: string): string {
  return frappe.bg.surface0(` ${code} `)
}

export async function renderCodeBlock(
  code: string,
  lang: string,
  config: CodeConfig
): Promise<string> {
  const useNerdFonts = config.useNerdFonts ?? supportsNerdFonts()
  let highlighted: string

  try {
    // Skip syntax highlighting for very long content (bat pattern)
    if (code.length > MAX_LINE_LENGTH) {
      highlighted = frappe.subtext0(code)
    } else {
      const hl = await getHighlighter(config.theme)
      const langId = normalizeLang(lang)

      if (hl.getLoadedLanguages().includes(langId)) {
        highlighted = hl.codeToAnsi(code, { lang: langId, theme: config.theme })
      } else {
        highlighted = frappe.subtext0(code)
      }
    }
  } catch {
    highlighted = frappe.subtext0(code)
  }

  const wrapped = config.wrap
    ? wrapCodeLines(highlighted, config.width - 4, config.continuation)
    : highlighted

  // Build header with language icon/label
  const langIcon = getLanguageIcon(lang, useNerdFonts)
  const title = langIcon ? `${langIcon} ${lang}` : lang || 'code'

  return boxen(wrapped, {
    title: lang ? frappe.blue(title) : undefined,
    titleAlignment: 'left',
    padding: { left: 1, right: 1, top: 0, bottom: 0 },
    borderColor: '#626880', // frappe.surface2
    borderStyle: 'round',
    width: config.width
  })
}

function normalizeLang(lang: string): string {
  const aliases: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    py: 'python',
    rb: 'ruby',
    rs: 'rust',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    cs: 'csharp',
    kt: 'kotlin'
  }
  return aliases[lang] ?? lang
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/elements/code.test.ts`
Expected: PASS (5 tests)

---

## Phase 3: Parser Integration (Sequential)

### Task 3.1: Marked Parser with Custom Renderer

**Files:**
- Create: `src/lib/parser.ts`
- Create: `src/lib/parser.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/parser.test.ts
import { describe, expect, test } from 'bun:test'
import { parseMarkdown } from './parser'

describe('parseMarkdown', () => {
  test('parses headings', async () => {
    const md = '# Hello World'
    const result = await parseMarkdown(md, { width: 80 })
    expect(result).toContain('Hello World')
    expect(result).toContain('━')
  })

  test('parses paragraphs', async () => {
    const md = 'This is a paragraph.'
    const result = await parseMarkdown(md, { width: 80 })
    expect(result).toContain('This is a paragraph')
  })

  test('parses code blocks', async () => {
    const md = '```ts\nconst x = 1\n```'
    const result = await parseMarkdown(md, { width: 80 })
    expect(result).toContain('const')
    expect(result).toContain('─')
  })

  test('parses links', async () => {
    const md = '[Example](https://example.com)'
    const result = await parseMarkdown(md, { width: 80, osc8: false })
    expect(result).toContain('Example')
    expect(result).toContain('example.com')
  })

  test('parses tables', async () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |'
    const result = await parseMarkdown(md, { width: 80 })
    expect(result).toContain('┌')
    expect(result).toContain('A')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/parser.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/parser.ts
import { Marked } from 'marked'
import { renderHeading } from './elements/heading'
import { renderCodeBlock, renderInlineCode } from './elements/code'
import { renderLink } from './elements/link'
import { renderListItem } from './elements/list'
import { renderTable } from './elements/table'
import { renderBlockquote } from './elements/blockquote'
import { renderText } from './elements/text'

interface ParseOptions {
  width: number
  osc8?: boolean | 'auto'
  wrap?: boolean
  hyphenation?: boolean
  codeTheme?: string
}

const codeBlocks = new Map<string, { code: string; lang: string }>()

export function createRenderer(options: ParseOptions) {
  return {
    heading({ text, depth }: { text: string; depth: number }) {
      return renderHeading(text, depth, options.width)
    },

    paragraph({ text }: { text: string }) {
      return renderText(text, { width: options.width, hyphenation: options.hyphenation ?? true }) + '\n'
    },

    code({ text, lang }: { text: string; lang?: string }) {
      const id = `__CODE_${Date.now()}_${Math.random().toString(36)}__`
      codeBlocks.set(id, { code: text, lang: lang ?? '' })
      return id
    },

    codespan({ text }: { text: string }) {
      return renderInlineCode(text)
    },

    link({ href, text }: { href: string; text: string }) {
      return renderLink(text, href, { osc8: options.osc8 ?? 'auto', show_urls: false })
    },

    list({ items, ordered }: { items: Array<{ text: string }>; ordered: boolean }) {
      return items.map((item, i) => renderListItem(item.text, ordered, 0, i + 1)).join('\n') + '\n'
    },

    listitem({ text }: { text: string }) {
      return text
    },

    table({ header, rows }: { header: Array<{ text: string }>; rows: Array<Array<{ text: string }>> }) {
      return renderTable(header.map((h) => h.text), rows.map((row) => row.map((c) => c.text))) + '\n'
    },

    blockquote({ text }: { text: string }) {
      return renderBlockquote(text.trim()) + '\n'
    },

    hr() {
      return '\n' + '─'.repeat(options.width) + '\n\n'
    },

    strong({ text }: { text: string }) {
      return `\x1b[1m${text}\x1b[22m`
    },

    em({ text }: { text: string }) {
      return `\x1b[3m${text}\x1b[23m`
    }
  }
}

export async function parseMarkdown(markdown: string, options: ParseOptions): Promise<string> {
  codeBlocks.clear()

  const marked = new Marked()
  marked.use({ renderer: createRenderer(options) })

  let result = marked.parse(markdown) as string

  for (const [id, { code, lang }] of codeBlocks) {
    const rendered = await renderCodeBlock(code, lang, {
      width: options.width,
      wrap: options.wrap ?? true,
      continuation: '↪',
      theme: options.codeTheme ?? 'catppuccin-frappe'
    })
    result = result.replace(id, rendered)
  }

  codeBlocks.clear()
  return result
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/parser.test.ts`
Expected: PASS (5 tests)

---

### Task 3.2: Main Render Orchestration

**Files:**
- Create: `src/lib/render.ts`
- Create: `src/lib/render.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/render.test.ts
import { describe, expect, test } from 'bun:test'
import { render } from './render'
import { DEFAULT_CONFIG } from './config'

describe('render', () => {
  test('renders markdown string to ANSI', async () => {
    const md = '# Hello\n\nWorld'
    const result = await render(md, DEFAULT_CONFIG)

    expect(result).toContain('Hello')
    expect(result).toContain('World')
    expect(result).toContain('\x1b[')
  })

  test('handles empty input', async () => {
    const result = await render('', DEFAULT_CONFIG)
    expect(result).toBe('')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/lib/render.test.ts`
Expected: FAIL - cannot find module

**Step 3: Write minimal implementation**

```typescript
// src/lib/render.ts
import { parseMarkdown } from './parser'
import { getTerminalWidth } from './width'
import type { Config } from './config'

export async function render(markdown: string, config: Config): Promise<string> {
  if (!markdown.trim()) return ''

  const width = config.width === 'auto'
    ? getTerminalWidth()
    : getTerminalWidth(config.width as number)

  return parseMarkdown(markdown, {
    width,
    osc8: config.links.osc8,
    wrap: config.code.wrap,
    hyphenation: config.text.hyphenation,
    codeTheme: config.code.theme
  })
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/lib/render.test.ts`
Expected: PASS (2 tests)

---

## Phase 4: CLI Integration (Sequential)

### Task 4.1: Update CLI Entry Point

**Files:**
- Modify: `src/index.ts`
- Create: `src/index.test.ts`

**Step 1: Write the failing test**

```typescript
// src/index.test.ts
import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import { $ } from 'bun'

describe('md CLI', () => {
  const testFile = '/tmp/md-test.md'

  beforeAll(async () => {
    await Bun.write(testFile, '# Test\n\nHello world')
  })

  afterAll(async () => {
    await $`rm -f ${testFile}`.quiet()
  })

  test('--version shows version', async () => {
    const result = await $`bun run src/index.ts --version`.text()
    expect(result).toMatch(/md v\d+\.\d+\.\d+/)
  })

  test('--help shows help', async () => {
    const result = await $`bun run src/index.ts --help`.text()
    expect(result).toContain('Usage')
  })

  test('renders markdown file', async () => {
    const result = await $`bun run src/index.ts ${testFile} --no-pager`.text()
    expect(result).toContain('Test')
    expect(result).toContain('Hello world')
  })

  test('--raw passes through without rendering', async () => {
    const result = await $`bun run src/index.ts ${testFile} --raw`.text()
    expect(result).toContain('# Test')
  })

  test('errors on missing file', async () => {
    const proc = $`bun run src/index.ts /nonexistent/file.md`.nothrow()
    const result = await proc
    expect(result.exitCode).not.toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test src/index.test.ts`
Expected: FAIL - missing flags

**Step 3: Write updated implementation**

```typescript
// src/index.ts
#!/usr/bin/env bun

import pkg from '../package.json' with { type: 'json' }
import { loadConfig, getConfigPath, DEFAULT_CONFIG } from './lib/config'
import { render } from './lib/render'
import { shouldUsePager, pipeToLess, countLines, shouldUseColor, PagingMode } from './lib/pager'
import { getTerminalWidth, getTerminalHeight } from './lib/width'
import { frappe, theme, pc } from './ui/theme'

const args = Bun.argv.slice(2)
const version = pkg.version

function getArgValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag)
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1]
  }
  return undefined
}

const flags = {
  help: args.includes('--help') || args.includes('-h'),
  version: args.includes('--version') || args.includes('-v'),
  plain: args.includes('--plain') || args.includes('-p'),
  raw: args.includes('--raw') || args.includes('-r'),
  noPager: args.includes('--no-pager'),
  scroll: args.includes('--scroll'),
  wrap: args.includes('--wrap'),
  width: getArgValue(args, '-w') ?? getArgValue(args, '--width')
}

if (flags.version) {
  console.log(`md v${version}`)
  process.exit(0)
}

if (flags.help) {
  const helpText = `${theme.heading('Usage:')}
  ${frappe.mauve('md')} ${pc.dim('[file]')} ${pc.dim('[options]')}

${theme.heading('Options:')}
  ${frappe.green('-h, --help')}        Show this help message
  ${frappe.green('-v, --version')}     Show version number
  ${frappe.green('-w, --width <n>')}   Set output width (default: auto)
  ${frappe.green('-p, --plain')}       No colors, just structure
  ${frappe.green('-r, --raw')}         Pass through without rendering
  ${frappe.green('--no-pager')}        Write directly, never use pager
  ${frappe.green('--scroll')}          Horizontal scroll for code blocks
  ${frappe.green('--wrap')}            Wrap code blocks (default)

${theme.heading('Examples:')}
  ${pc.dim('$')} md README.md
  ${pc.dim('$')} md docs/guide.md --width 80
  ${pc.dim('$')} cat file.md | md`

  console.log(helpText)
  process.exit(0)
}

async function main(): Promise<void> {
  const filePath = args.find((arg) => !arg.startsWith('-') && arg !== flags.width)
  const hasStdin = !process.stdin.isTTY
  const stdoutTTY = process.stdout.isTTY ?? false
  const stdinTTY = process.stdin.isTTY ?? true

  if (!filePath && !hasStdin) {
    console.log(theme.muted('No file specified. Use --help for usage information.'))
    process.exit(1)
  }

  let content: string
  if (filePath) {
    const file = Bun.file(filePath)
    if (!(await file.exists())) {
      console.error(frappe.red(`Error: File not found: ${filePath}`))
      process.exit(1)
    }
    content = await file.text()
  } else {
    content = await Bun.stdin.text()
  }

  if (flags.raw) {
    console.log(content)
    return
  }

  const config = await loadConfig(getConfigPath())

  if (flags.width) {
    ;(config as { width: number | 'auto' }).width = parseInt(flags.width, 10)
  }
  if (flags.scroll) config.code.wrap = false
  if (flags.wrap) config.code.wrap = true

  let output = await render(content, config)

  const useColor = shouldUseColor() && !flags.plain
  if (!useColor) {
    output = output.replace(/\x1b\[[0-9;]*m/g, '')
  }

  const width = config.width === 'auto' ? getTerminalWidth() : config.width
  const lines = countLines(output, width as number)
  const height = getTerminalHeight()

  const pagingMode = shouldUsePager({
    stdoutTTY,
    stdinTTY,
    lines,
    height,
    noPager: flags.noPager
  })

  if (pagingMode !== PagingMode.Never) {
    await pipeToLess(output, config.pager)
  } else {
    console.log(output)
  }
}

main().catch((err) => {
  console.error(frappe.red(String(err)))
  process.exit(1)
})
```

**Step 4: Run test to verify it passes**

Run: `bun test src/index.test.ts`
Expected: PASS (5 tests)

---

### Task 4.2: Final Verification

**Step 1: Run full test suite**

Run: `bun test`
Expected: All tests pass

**Step 2: Run linting**

Run: `bun run lint`
Expected: No errors

**Step 3: Run type checking**

Run: `bun run tc`
Expected: No errors

**Step 4: Manual smoke test**

Run: `bun run dev README.md --no-pager`
Expected: Beautifully rendered markdown

**Step 5: Orchestrator commits all work**

```
feat: implement markdown viewer with full rendering pipeline

- Width detection with 120-char cap for readability (glow pattern)
- Three-state paging with smart TTY detection (bat pattern)
- Element renderers: headings, code, tables, links, lists, blockquotes
- Shiki syntax highlighting with lazy loading
- OSC 8 clickable hyperlinks for supported terminals
- XDG config with TOML support
- Respects NO_COLOR environment variable
```

---

## Summary

**Total tasks:** 13 tasks across 4 phases

**Parallelizable groups:**
- Phase 1 (Tasks 1.1-1.4): 4 parallel agents (width, config, pager, nerd fonts)
- Phase 2 (Tasks 2.1-2.7): 7 parallel agents (element renderers)

**Sequential tasks:**
- Phase 0: Setup
- Phase 3: Parser integration
- Phase 4: CLI integration

**Test coverage:** Every module has corresponding test file with TDD approach.

**Key patterns borrowed:**
- **From glow:** Width capping at 120, glamour-style element rendering
- **From bat:** Three-state paging, smart stdin/stdout TTY detection, `-R -F -K` less args, NO_COLOR respect, LESSCHARSET=UTF-8, skip highlighting for lines >16KB

**Additional features:**
- **Nerd Fonts:** Language icons for code blocks (󰛑 for TS,  for Python, etc.) with automatic detection and text label graceful degradation
- **Boxen:** Used for H1 headings and code blocks for prominent visual treatment
- **console-table-printer:** Proper grid tables with full cell borders
- **Expanded Shiki languages:** 50+ languages including all major languages, shells, configs, and data formats
- **Banner:** Kept figlet + gradient-string for help/version display

**Deviation from skill:** Agents do not have git access. The orchestrator reviews agent work and handles all commits after each phase or logical grouping.
