// src/lib/elements/blockquote.test.ts
import { describe, expect, test } from 'bun:test';
import { renderBlockquote } from './blockquote';

describe('renderBlockquote', () => {
  test('adds vertical bar prefix to each line', () => {
    const result = renderBlockquote('Quote text');
    expect(result).toContain('│');
  });

  test('handles multiline quotes', () => {
    const result = renderBlockquote('Line 1\nLine 2\nLine 3');
    const barCount = (result.match(/│/g) || []).length;
    expect(barCount).toBe(3);
  });

  test('applies quote styling', () => {
    const result = renderBlockquote('Styled quote');
    expect(result).toContain('\x1b[');
  });
});
