// src/ui/themes/ansi.test.ts
import { describe, expect, test } from 'bun:test';
import { hexToAnsi256 } from './ansi';

describe('hexToAnsi256', () => {
  test('converts pure red to ANSI 196', () => {
    expect(hexToAnsi256('#ff0000')).toBe(196);
  });

  test('converts pure green to ANSI 46', () => {
    expect(hexToAnsi256('#00ff00')).toBe(46);
  });

  test('converts pure blue to ANSI 21', () => {
    expect(hexToAnsi256('#0000ff')).toBe(21);
  });

  test('converts white to ANSI 231', () => {
    expect(hexToAnsi256('#ffffff')).toBe(231);
  });

  test('converts black to ANSI 16', () => {
    expect(hexToAnsi256('#000000')).toBe(16);
  });

  test('converts Catppuccin Frappe mauve #ca9ee6 to closest ANSI', () => {
    const result = hexToAnsi256('#ca9ee6');
    expect(result).toBeGreaterThanOrEqual(140);
    expect(result).toBeLessThanOrEqual(189);
  });

  test('handles lowercase hex', () => {
    expect(hexToAnsi256('#ff0000')).toBe(hexToAnsi256('#FF0000'));
  });
});
