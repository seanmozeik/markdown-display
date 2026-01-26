// src/lib/elements/text.test.ts
import { describe, expect, test } from 'bun:test';
import { visibleLength } from '../ansi';
import { renderText, wrapText } from './text';

describe('wrapText', () => {
  test('wraps text at word boundaries', () => {
    const text = 'This is a long sentence that should wrap';
    const result = wrapText(text, 20);
    const lines = result.split('\n');

    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(20);
    }
  });

  test('preserves short lines', () => {
    const text = 'Short';
    const result = wrapText(text, 80);
    expect(result).toBe('Short');
  });
});

describe('renderText', () => {
  test('renders paragraph with proper styling', () => {
    const result = renderText('Hello world', { hyphenation: false, width: 80 });
    expect(result).toContain('Hello world');
  });

  test('applies text color', () => {
    const result = renderText('Colored', { hyphenation: false, width: 80 });
    expect(result).toContain('\x1b[');
  });
});

describe('wrapText with ANSI codes', () => {
  test('keeps ANSI-styled content atomic when wrapping', () => {
    // Simulate inline code: \x1b[38;5;X;48;5;Ym foo \x1b[0m
    const styledCode = '\x1b[38;5;123;48;5;234m foo \x1b[0m';
    const text = `Some text before ${styledCode} and after`;
    const result = wrapText(text, 30);

    // The styled block should stay together - check reset follows start
    expect(result).toContain(styledCode);
    // Should not have the ANSI start on one line and reset on another
    for (const line of result.split('\n')) {
      const hasStart = line.includes('\x1b[38;5;');
      const hasReset = line.includes('\x1b[0m');
      // If line has ANSI start, it must also have reset (or no ANSI at all)
      if (hasStart) {
        expect(hasReset).toBe(true);
      }
    }
  });

  test('handles multiple inline code blocks', () => {
    const code1 = '\x1b[38;5;1m a \x1b[0m';
    const code2 = '\x1b[38;5;2m b \x1b[0m';
    const text = `Word ${code1} word ${code2} word`;
    const result = wrapText(text, 20);

    expect(result).toContain(code1);
    expect(result).toContain(code2);
  });
});

describe('wrapText with hyphenation', () => {
  test('breaks long words at syllable boundaries', () => {
    const text = 'extraordinary';
    const result = wrapText(text, 8, { hyphenation: true, locale: 'en-us' });
    // Should break with visible hyphens at line ends
    expect(result).toContain('-');
    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  test('does not hyphenate when disabled', () => {
    const text = 'extraordinary';
    const result = wrapText(text, 8, { hyphenation: false, locale: 'en-us' });
    // Without hyphenation, word gets hard-broken without hyphens
    expect(result).not.toContain('-\n');
  });

  test('soft hyphens do not affect visible length calculation', () => {
    // A word with soft hyphens inserted should measure same as without
    const withSoftHyphens = 'ex\u00ADtra\u00ADor\u00ADdi\u00ADnary';
    const result = visibleLength(withSoftHyphens);
    expect(result).toBe(13); // "extraordinary" without soft hyphens
  });
});
