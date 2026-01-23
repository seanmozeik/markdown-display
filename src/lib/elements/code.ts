// src/lib/elements/code.ts
import boxen from 'boxen';
import { theme } from '../../ui/themes';
import {
  getHexColors,
  getInlineCodeStyle,
  getLinkColor,
  getMutedColor,
  getSubtleColor
} from '../../ui/themes/semantic';
import { visibleLength } from '../ansi';
import { getLanguageLabel, normalizeLang, supportsNerdFonts } from '../languages';

interface CodeConfig {
  width: number;
  wrap: boolean;
  continuation: string;
  theme: string;
  useNerdFonts?: boolean;
}

const MAX_LINE_LENGTH = 16 * 1024; // Skip highlighting very long lines (bat pattern)

// Supported languages for syntax highlighting
const SUPPORTED_LANGS = new Set([
  // Core languages
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'scala',
  'lua',
  'perl',
  // Shell
  'bash',
  'shell',
  'zsh',
  'fish',
  'powershell',
  // Web
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'vue',
  'svelte',
  'jsx',
  'tsx',
  // Data formats
  'json',
  'yaml',
  'toml',
  'xml',
  'csv',
  // Markup
  'markdown',
  'latex',
  'tex',
  // Config
  'dockerfile',
  'nginx',
  'apache',
  'ini',
  'env',
  // Database
  'sql',
  'plsql',
  'graphql',
  'prisma',
  // Functional
  'haskell',
  'ocaml',
  'fsharp',
  'elixir',
  'erlang',
  'clojure',
  'lisp',
  'scheme',
  // Systems
  'zig',
  'nim',
  'crystal',
  'julia',
  'r',
  'matlab',
  // Other
  'vim',
  'diff',
  'git-commit',
  'git-rebase',
  'makefile',
  'cmake',
  'regex',
  'http',
  'jsonc',
  'jsonl',
  'wasm'
]);

// ESC character for ANSI escape sequence parsing (avoid literal \x1b for linter)
const ESC = String.fromCharCode(0x1b);
const ANSI_RESET = `${ESC}[0m`;
const ANSI_SGR_PATTERN = new RegExp(`${ESC}\\[([0-9;]*)m`);

function parseAnsiParams(sequence: string): string[] {
  const match = sequence.match(ANSI_SGR_PATTERN);
  if (!match || !match[1]) return [];
  return match[1].split(';').filter(Boolean);
}

/**
 * Track active ANSI styles. Handles basic SGR codes:
 * 0 = reset, 1 = bold, 2 = dim, 3 = italic, 4 = underline,
 * 30-37/90-97 = fg color, 38;5;N = 256 fg, 38;2;R;G;B = RGB fg,
 * 40-47/100-107 = bg color, 48;5;N = 256 bg, 48;2;R;G;B = RGB bg
 */
class AnsiState {
  private styles: Set<string> = new Set();
  private fgColor: string | null = null;
  private bgColor: string | null = null;

  apply(sequence: string): void {
    const params = parseAnsiParams(sequence);
    let i = 0;

    while (i < params.length) {
      const param = params[i]!;
      const code = Number.parseInt(param, 10);

      if (code === 0) {
        // Reset all
        this.styles.clear();
        this.fgColor = null;
        this.bgColor = null;
      } else if (code >= 1 && code <= 9) {
        // Style attributes (bold, dim, italic, underline, etc.)
        this.styles.add(param);
      } else if (code >= 21 && code <= 29) {
        // Turn off style attributes
        this.styles.delete(String(code - 20));
      } else if (code === 38 && params[i + 1] === '5') {
        // 256 foreground color
        this.fgColor = `38;5;${params[i + 2]}`;
        i += 2;
      } else if (code === 38 && params[i + 1] === '2') {
        // RGB foreground color
        this.fgColor = `38;2;${params[i + 2]};${params[i + 3]};${params[i + 4]}`;
        i += 4;
      } else if (code === 48 && params[i + 1] === '5') {
        // 256 background color
        this.bgColor = `48;5;${params[i + 2]}`;
        i += 2;
      } else if (code === 48 && params[i + 1] === '2') {
        // RGB background color
        this.bgColor = `48;2;${params[i + 2]};${params[i + 3]};${params[i + 4]}`;
        i += 4;
      } else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
        // Basic foreground colors
        this.fgColor = param;
      } else if (code === 39) {
        // Default foreground
        this.fgColor = null;
      } else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
        // Basic background colors
        this.bgColor = param;
      } else if (code === 49) {
        // Default background
        this.bgColor = null;
      }

      i++;
    }
  }

  toSequence(): string {
    const parts: string[] = [];

    for (const style of this.styles) {
      parts.push(style);
    }

    if (this.fgColor) parts.push(this.fgColor);
    if (this.bgColor) parts.push(this.bgColor);

    if (parts.length === 0) return '';
    return `${ESC}[${parts.join(';')}m`;
  }

  clone(): AnsiState {
    const copy = new AnsiState();
    copy.styles = new Set(this.styles);
    copy.fgColor = this.fgColor;
    copy.bgColor = this.bgColor;
    return copy;
  }

  isEmpty(): boolean {
    return this.styles.size === 0 && this.fgColor === null && this.bgColor === null;
  }
}

/**
 * Slice a string by visible character positions, preserving ANSI codes.
 * Returns [sliced portion with reset, remainder with state prefix]
 */
function sliceByVisible(str: string, start: number, end?: number): [string, string] {
  let visiblePos = 0;
  let startIdx = 0;
  let endIdx = str.length;
  let foundStart = start === 0;
  let foundEnd = end === undefined;

  const state = new AnsiState();
  let stateAtEnd: AnsiState | null = null;

  const ansiRegex = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');

  let i = 0;
  while (i < str.length) {
    // Check for ANSI escape sequence at current position
    ansiRegex.lastIndex = i;
    const match = ansiRegex.exec(str);

    if (match && match.index === i) {
      // Found ANSI sequence at current position - update state
      state.apply(match[0]);
      i += match[0].length;
      continue;
    }

    // This is a visible character
    if (!foundStart && visiblePos === start) {
      startIdx = i;
      foundStart = true;
    }

    visiblePos++;

    if (!foundEnd && end !== undefined && visiblePos === end) {
      endIdx = i + 1;
      stateAtEnd = state.clone();
      foundEnd = true;
      break;
    }

    i++;
  }

  // If we didn't find start, it means start is beyond string length
  if (!foundStart) {
    return ['', ''];
  }

  const sliced = str.slice(startIdx, endIdx);
  const remainder = str.slice(endIdx);

  // Add reset to end of sliced portion if we had active state
  const slicedWithReset = stateAtEnd && !stateAtEnd.isEmpty() ? sliced + ANSI_RESET : sliced;

  // Prepend state to remainder if there was active state
  const remainderWithState =
    stateAtEnd && !stateAtEnd.isEmpty() && remainder
      ? stateAtEnd.toSequence() + remainder
      : remainder;

  return [slicedWithReset, remainderWithState];
}

export function wrapCodeLines(code: string, width: number, continuation: string): string {
  const lines = code.split('\n');
  const wrapped: string[] = [];
  const continuationPrefix = `${getSubtleColor()(continuation)} `;
  const continuationWidth = continuation.length + 1;

  for (const line of lines) {
    if (visibleLength(line) <= width) {
      wrapped.push(line);
      continue;
    }

    // First chunk uses full width
    const [firstChunk, firstRest] = sliceByVisible(line, 0, width);
    wrapped.push(firstChunk);

    // Subsequent chunks reserve space for continuation prefix (+ 1 extra space)
    let remaining = firstRest;
    const chunkWidth = width - continuationWidth - 1;

    while (visibleLength(remaining) > 0) {
      const [chunk, rest] = sliceByVisible(remaining, 0, chunkWidth);
      wrapped.push(`${continuationPrefix} ${chunk}`);
      remaining = rest;
    }
  }

  return wrapped.join('\n');
}

export function renderInlineCode(code: string): string {
  return getInlineCodeStyle()(` ${code} `);
}

export async function renderCodeBlock(
  code: string,
  lang: string,
  config: CodeConfig
): Promise<string> {
  const useNerdFonts = config.useNerdFonts ?? supportsNerdFonts();
  let highlighted: string;

  try {
    // Skip syntax highlighting for very long content (bat pattern)
    if (code.length > MAX_LINE_LENGTH) {
      highlighted = getMutedColor()(code);
    } else {
      const langId = normalizeLang(lang);

      if (SUPPORTED_LANGS.has(langId)) {
        const { codeToANSI } = await import('@shikijs/cli');
        highlighted = await codeToANSI(
          code,
          langId as import('shiki').BundledLanguage,
          theme().shikiTheme as import('shiki').BundledTheme
        );
        // Shiki adds a trailing newline - remove it to avoid extra empty line in boxen
        highlighted = highlighted.replace(/\n$/, '');
      } else {
        highlighted = getMutedColor()(code);
      }
    }
  } catch {
    highlighted = getMutedColor()(code);
  }

  const wrapped = config.wrap
    ? wrapCodeLines(highlighted, config.width - 4, config.continuation)
    : highlighted;

  // Build header with language label (icon when nerd fonts enabled, name otherwise)
  const title = lang ? getLanguageLabel(lang, useNerdFonts) : undefined;

  const box = boxen(wrapped, {
    borderColor: getHexColors().subtle,
    borderStyle: 'round',
    padding: { bottom: 0, left: 1, right: 1, top: 0 },
    title: title ? getLinkColor()(title) : undefined,
    titleAlignment: 'left',
    width: config.width
  });

  // Add trailing newline for proper spacing after code block
  return `${box}\n`;
}
