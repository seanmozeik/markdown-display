/**
 * Shiki ANSI highlighting — lazy module load, LRU cache, safe fallbacks.
 * Patterns from claudewatch/src/render/shiki.ts.
 */
import type { codeToANSI as CodeToANSI } from '@shikijs/cli';
import { Effect } from 'effect';
import type { BundledLanguage, BundledTheme } from 'shiki';

import { themes } from '../ui/themes/generated';
import { normalizeLang } from './languages';

const BYTES_PER_KIB = 1024;
const MAX_CODE_SIZE = 16 * BYTES_PER_KIB;
const MAX_HIGHLIGHT_CACHE_ENTRIES = 128;
const START_INDEX = 0;
const TRAILING_NEWLINE_OFFSET = -1;
const EMPTY_LENGTH = 0;
const ANSI_SGR_PREFIX = '\u001B[';
const ANSI_SGR_SUFFIX = 'm';
const ITALIC_ON = '3';
const ITALIC_OFF = '23';

const makeGlobalPattern = (source: string): RegExp => new RegExp(source, 'gu');
const ANSI_SGR_PATTERN = makeGlobalPattern(String.raw`\u001B\[([0-9;]*)m`);

interface ShikiModule {
  codeToANSI: typeof CodeToANSI;
}

/** Languages passed to Shiki's codeToANSI (superset of icon map keys). */
export const SHIKI_SUPPORTED_LANGS = new Set<string>([
  'apache',
  'bash',
  'c',
  'clojure',
  'cmake',
  'cpp',
  'csharp',
  'css',
  'csv',
  'diff',
  'dockerfile',
  'elixir',
  'env',
  'erlang',
  'fsharp',
  'git-commit',
  'git-rebase',
  'go',
  'graphql',
  'haskell',
  'html',
  'http',
  'ini',
  'java',
  'javascript',
  'json',
  'jsonc',
  'jsonl',
  'julia',
  'kotlin',
  'latex',
  'less',
  'lisp',
  'lua',
  'makefile',
  'markdown',
  'matlab',
  'nginx',
  'nim',
  'ocaml',
  'perl',
  'php',
  'plsql',
  'powershell',
  'prisma',
  'python',
  'r',
  'regex',
  'ruby',
  'rust',
  'sass',
  'scala',
  'scheme',
  'scss',
  'shell',
  'sql',
  'svelte',
  'swift',
  'tex',
  'toml',
  'tsx',
  'typescript',
  'vim',
  'vue',
  'wasm',
  'xml',
  'yaml',
  'zig',
  'zsh',
  'fish',
  'jsx',
]);

let cachedShiki: ShikiModule | null = null;
const highlightedCodeCache = new Map<string, string>();

const isBundledLanguage = (value: string): value is BundledLanguage =>
  SHIKI_SUPPORTED_LANGS.has(value);
const isBundledTheme = (value: string): value is BundledTheme => value in themes;

export const stripItalicAnsi = (code: string): string =>
  code.replaceAll(ANSI_SGR_PATTERN, (_full, params: string) => {
    const filtered = params
      .split(';')
      .filter((part) => part.length > EMPTY_LENGTH && part !== ITALIC_ON && part !== ITALIC_OFF);
    if (filtered.length === EMPTY_LENGTH) {
      return '';
    }
    return `${ANSI_SGR_PREFIX}${filtered.join(';')}${ANSI_SGR_SUFFIX}`;
  });

const loadShiki = async (): Promise<ShikiModule> => {
  cachedShiki ??= await import('@shikijs/cli');
  return cachedShiki;
};

const makeHighlightCacheKey = (code: string, lang: string, themeId: string): string =>
  `${themeId}\u0000${lang}\u0000${code}`;

const rememberHighlightedCode = (key: string, code: string): void => {
  if (highlightedCodeCache.size >= MAX_HIGHLIGHT_CACHE_ENTRIES) {
    const oldestKey = highlightedCodeCache.keys().next().value;
    if (oldestKey !== undefined) {
      highlightedCodeCache.delete(oldestKey);
    }
  }
  highlightedCodeCache.set(key, code);
};

export const clearHighlightCache = (): void => {
  highlightedCodeCache.clear();
};

/**
 * Highlight code using Shiki; returns plain code on unsupported lang/theme, size limit, or errors.
 */
export const highlightCode = Effect.fn('md.highlight-code')(function* highlightCodeEffect(
  code: string,
  lang: string,
  themeId: string,
) {
  if (code.length > MAX_CODE_SIZE) {
    return code;
  }

  const langId = normalizeLang(lang);
  if (!isBundledLanguage(langId) || !isBundledTheme(themeId)) {
    return code;
  }

  const cacheKey = makeHighlightCacheKey(code, langId, themeId);
  const cached = highlightedCodeCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  return yield* Effect.gen(function* highlightCodeInner() {
    const shiki = yield* Effect.tryPromise(() => loadShiki());
    const highlighted = yield* Effect.tryPromise(() => shiki.codeToANSI(code, langId, themeId));
    const normalized = highlighted.endsWith('\n')
      ? highlighted.slice(START_INDEX, TRAILING_NEWLINE_OFFSET)
      : highlighted;
    const output = stripItalicAnsi(normalized);
    rememberHighlightedCode(cacheKey, output);
    return output;
  }).pipe(Effect.catch(() => Effect.succeed(code)));
});
