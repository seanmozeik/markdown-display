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
