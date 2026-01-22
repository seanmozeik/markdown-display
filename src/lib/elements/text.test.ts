// src/lib/elements/text.test.ts
import { describe, expect, test } from 'bun:test';
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
