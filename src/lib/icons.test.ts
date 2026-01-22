// src/lib/icons.test.ts
import { afterEach, describe, expect, test } from 'bun:test';
import { getLanguageIcon, LANGUAGE_ICONS, supportsNerdFonts } from './icons';

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

describe('getLanguageIcon', () => {
  test('returns icon for known languages', () => {
    expect(getLanguageIcon('typescript', true)).toBe('󰛑');
    expect(getLanguageIcon('python', true)).toBe('');
    expect(getLanguageIcon('rust', true)).toBe('');
  });

  test('returns text label when nerd fonts disabled', () => {
    expect(getLanguageIcon('typescript', false)).toBe('ts');
    expect(getLanguageIcon('python', false)).toBe('py');
  });

  test('handles language aliases', () => {
    expect(getLanguageIcon('ts', true)).toBe('󰛑');
    expect(getLanguageIcon('js', true)).toBe('');
    expect(getLanguageIcon('py', true)).toBe('');
  });

  test('returns empty string for unknown languages', () => {
    expect(getLanguageIcon('unknown-lang', true)).toBe('');
    expect(getLanguageIcon('unknown-lang', false)).toBe('');
  });
});

describe('LANGUAGE_ICONS', () => {
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
      expect(LANGUAGE_ICONS[lang]).toBeDefined();
    }
  });
});
