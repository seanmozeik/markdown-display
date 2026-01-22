// src/lib/elements/code.test.ts
import { describe, expect, test } from 'bun:test';
import { renderCodeBlock, renderInlineCode, wrapCodeLines } from './code';

describe('wrapCodeLines', () => {
  test('wraps long lines with continuation marker', () => {
    const code = 'x'.repeat(100);
    const result = wrapCodeLines(code, 50, '↪');

    expect(result).toContain('↪');
    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  test('preserves short lines', () => {
    const code = 'short line';
    const result = wrapCodeLines(code, 80, '↪');
    expect(result).toBe('short line');
  });
});

describe('renderInlineCode', () => {
  test('applies inline code styling', () => {
    const result = renderInlineCode('const x = 1');
    expect(result).toContain('\x1b[');
    expect(result).toContain('const x = 1');
  });
});

describe('renderCodeBlock', () => {
  test('renders code in boxen container', async () => {
    const result = await renderCodeBlock('const x = 1', 'ts', {
      continuation: '↪',
      theme: 'catppuccin-frappe',
      useNerdFonts: false,
      width: 60,
      wrap: true
    });

    expect(result).toContain('const');
    // Boxen uses box-drawing characters
    expect(result).toMatch(/[┌┐└┘│─╭╮╯╰]/);
  });

  test('includes language label in header', async () => {
    const result = await renderCodeBlock('print("hi")', 'python', {
      continuation: '↪',
      theme: 'catppuccin-frappe',
      useNerdFonts: false,
      width: 60,
      wrap: true
    });

    expect(result).toContain('py'); // text label when nerd fonts disabled
  });

  test('handles unknown language gracefully', async () => {
    const result = await renderCodeBlock('some code', 'unknown-lang', {
      continuation: '↪',
      theme: 'catppuccin-frappe',
      useNerdFonts: false,
      width: 60,
      wrap: true
    });

    expect(result).toContain('some code');
  });
});
