// src/lib/elements/code.ts
import boxen from 'boxen';
import { frappe } from '../../ui/theme';
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

// ESC character for ANSI escape sequence parsing
const ESC = String.fromCharCode(0x1b);

/**
 * Slice a string by visible character positions, preserving ANSI codes.
 * Returns [sliced portion, remainder]
 */
function sliceByVisible(str: string, start: number, end?: number): [string, string] {
  let visiblePos = 0;
  let startIdx = 0;
  let endIdx = str.length;
  let foundStart = start === 0;
  let foundEnd = end === undefined;

  const ansiStartRegex = new RegExp(`^${ESC}\\[[0-9;]*m`);

  for (let i = 0; i < str.length; i++) {
    // Check for ANSI escape sequence
    const match = str.slice(i).match(ansiStartRegex);
    if (match) {
      // Skip over ANSI sequence (don't count as visible)
      i += match[0].length - 1;
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
      foundEnd = true;
      break;
    }
  }

  // If we didn't find start, it means start is beyond string length
  if (!foundStart) {
    return ['', ''];
  }

  return [str.slice(startIdx, endIdx), str.slice(endIdx)];
}

export function wrapCodeLines(code: string, width: number, continuation: string): string {
  const lines = code.split('\n');
  const wrapped: string[] = [];
  const continuationPrefix = `${frappe.surface2(continuation)} `;
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
  // Glow-inspired: colored text on subtle background with padding
  return frappe.inlineCode(` ${code} `);
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
      highlighted = frappe.subtext0(code);
    } else {
      const langId = normalizeLang(lang);

      if (SUPPORTED_LANGS.has(langId)) {
        const { codeToANSI } = await import('@shikijs/cli');
        // Cast langId and theme to their expected types since we've validated langId
        highlighted = await codeToANSI(
          code,
          langId as import('shiki').BundledLanguage,
          config.theme as import('shiki').BundledTheme
        );
        // Shiki adds a trailing newline - remove it to avoid extra empty line in boxen
        highlighted = highlighted.replace(/\n$/, '');
      } else {
        highlighted = frappe.subtext0(code);
      }
    }
  } catch {
    highlighted = frappe.subtext0(code);
  }

  const wrapped = config.wrap
    ? wrapCodeLines(highlighted, config.width - 4, config.continuation)
    : highlighted;

  // Build header with language label (icon when nerd fonts enabled, name otherwise)
  const title = lang ? getLanguageLabel(lang, useNerdFonts) : undefined;

  const box = boxen(wrapped, {
    borderColor: '#626880', // frappe.surface2
    borderStyle: 'round',
    padding: { bottom: 0, left: 1, right: 1, top: 0 },
    title: title ? frappe.blue(title) : undefined,
    titleAlignment: 'left',
    width: config.width
  });

  // Add trailing newline for proper spacing after code block
  return `${box}\n`;
}
