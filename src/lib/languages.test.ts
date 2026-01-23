// src/lib/languages.test.ts
import { afterEach, describe, expect, test } from 'bun:test';
import {
  getLanguageIcon,
  getLanguageLabel,
  LANGUAGES,
  resolveNerdFonts,
  supportsNerdFonts
} from './languages';

describe('supportsNerdFonts', () => {
  const originalTermProgram = Bun.env.TERM_PROGRAM;
  const originalNerdFont = Bun.env.NERD_FONTS;

  afterEach(() => {
    if (originalTermProgram) Bun.env.TERM_PROGRAM = originalTermProgram;
    else delete Bun.env.TERM_PROGRAM;
    if (originalNerdFont) Bun.env.NERD_FONTS = originalNerdFont;
    else delete Bun.env.NERD_FONTS;
  });

  test('returns true when NERD_FONTS env is set', () => {
    Bun.env.NERD_FONTS = '1';
    expect(supportsNerdFonts()).toBe(true);
  });

  test('returns true for known nerd font terminals', () => {
    delete Bun.env.NERD_FONTS;
    for (const term of ['WezTerm', 'kitty']) {
      Bun.env.TERM_PROGRAM = term;
      expect(supportsNerdFonts()).toBe(true);
    }
  });

  test('returns false for unknown terminals without env override', () => {
    delete Bun.env.NERD_FONTS;
    Bun.env.TERM_PROGRAM = 'unknown';
    expect(supportsNerdFonts()).toBe(false);
  });
});

describe('getLanguageIcon (deprecated, delegates to getLanguageLabel)', () => {
  test('returns icon for known languages when nerd fonts enabled', () => {
    // Icons exist and are non-empty strings
    expect(getLanguageIcon('typescript', true)).toBe(LANGUAGES.typescript?.icon);
    expect(getLanguageIcon('python', true)).toBe(LANGUAGES.python?.icon);
    expect(getLanguageIcon('rust', true)).toBe(LANGUAGES.rust?.icon);
  });

  test('returns normalized language name when nerd fonts disabled', () => {
    expect(getLanguageIcon('typescript', false)).toBe('typescript');
    expect(getLanguageIcon('python', false)).toBe('python');
  });

  test('handles language aliases', () => {
    // 'ts' normalizes to 'typescript'
    expect(getLanguageIcon('ts', true)).toBe(LANGUAGES.typescript?.icon);
    expect(getLanguageIcon('js', true)).toBe(LANGUAGES.javascript?.icon);
    expect(getLanguageIcon('py', true)).toBe(LANGUAGES.python?.icon);
  });

  test('returns normalized name for unknown languages', () => {
    expect(getLanguageIcon('unknown-lang', true)).toBe('unknown-lang');
    expect(getLanguageIcon('unknown-lang', false)).toBe('unknown-lang');
  });
});

describe('LANGUAGES', () => {
  test('has icons for common languages', () => {
    const expected = [
      'typescript',
      'javascript',
      'python',
      'rust',
      'go',
      'java',
      'c',
      'cpp',
      'ruby',
      'php',
      'swift',
      'kotlin',
      'lua',
      'bash',
      'json',
      'yaml',
      'markdown',
      'html',
      'css',
      'sql'
    ];
    for (const lang of expected) {
      expect(LANGUAGES[lang]).toBeDefined();
    }
  });
});

describe('getLanguageLabel', () => {
  test('returns icon when nerdFonts enabled and icon exists', () => {
    const result = getLanguageLabel('typescript', true);
    expect(result).toBe(LANGUAGES.typescript?.icon);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns language name when nerdFonts disabled', () => {
    const result = getLanguageLabel('typescript', false);
    expect(result).toBe('typescript');
  });

  test('returns normalized name when no icon exists and nerdFonts enabled', () => {
    const result = getLanguageLabel('unknownlang', true);
    expect(result).toBe('unknownlang');
  });

  test('normalizes aliases', () => {
    expect(getLanguageLabel('ts', false)).toBe('typescript');
    expect(getLanguageLabel('js', false)).toBe('javascript');
  });
});

describe('resolveNerdFonts', () => {
  test('returns false when auto (default off)', () => {
    expect(resolveNerdFonts('auto')).toBe(false);
  });

  test('returns true when explicitly true', () => {
    expect(resolveNerdFonts(true)).toBe(true);
  });

  test('returns false when explicitly false', () => {
    expect(resolveNerdFonts(false)).toBe(false);
  });
});
