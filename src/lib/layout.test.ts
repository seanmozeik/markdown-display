import { describe, expect, test } from 'bun:test';
import { applyPadding, calculateLayout } from './layout';

describe('calculateLayout', () => {
  describe('with maxWidth set (readability mode)', () => {
    test('centers content when terminal is wider than maxWidth', () => {
      const result = calculateLayout(120, { maxWidth: 80, padding: true });
      expect(result.contentWidth).toBe(80);
      expect(result.sidePadding).toBe(20); // (120 - 80) / 2
    });

    test('constrains to terminal width minus minimum padding', () => {
      const result = calculateLayout(60, { maxWidth: 80, padding: true });
      expect(result.contentWidth).toBe(58); // 60 - 2 (min 1 each side)
      expect(result.sidePadding).toBe(1);
    });
  });

  describe('with padding disabled', () => {
    test('uses full terminal width', () => {
      const result = calculateLayout(100, { maxWidth: 0, padding: false });
      expect(result.contentWidth).toBe(100);
      expect(result.sidePadding).toBe(0);
    });
  });

  describe('responsive padding breakpoints', () => {
    test('narrow terminal (<60) gets 1 space padding', () => {
      const result = calculateLayout(50, { maxWidth: 0, padding: true });
      expect(result.sidePadding).toBe(1);
      expect(result.contentWidth).toBe(48);
    });

    test('medium terminal (60-100) gets 2 space padding', () => {
      const result = calculateLayout(80, { maxWidth: 0, padding: true });
      expect(result.sidePadding).toBe(2);
      expect(result.contentWidth).toBe(76);
    });

    test('wide terminal (>100) gets 3 space padding', () => {
      const result = calculateLayout(120, { maxWidth: 0, padding: true });
      expect(result.sidePadding).toBe(3);
      expect(result.contentWidth).toBe(114);
    });
  });
});

describe('applyPadding', () => {
  test('prefixes each line with padding', () => {
    const content = 'line1\nline2\nline3';
    const result = applyPadding(content, 2);
    expect(result).toBe('  line1\n  line2\n  line3');
  });

  test('returns unchanged content when padding is 0', () => {
    const content = 'line1\nline2';
    const result = applyPadding(content, 0);
    expect(result).toBe(content);
  });

  test('handles empty content', () => {
    const result = applyPadding('', 3);
    expect(result).toBe('   ');
  });

  test('handles single line', () => {
    const result = applyPadding('hello', 1);
    expect(result).toBe(' hello');
  });
});
