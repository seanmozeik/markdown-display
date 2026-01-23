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

  test('does not have extra empty line at bottom of code block', async () => {
    const result = await renderCodeBlock('const x = 1;', 'ts', {
      continuation: '↪',
      theme: 'catppuccin-frappe',
      useNerdFonts: false,
      width: 60,
      wrap: true
    });

    const lines = result.split('\n');
    // Structure should be: [header, code, closing border, empty from trailing newline]
    // Line at index 1 should be the code line (between header and closing border)
    const codeLine = lines[1];
    expect(codeLine).toMatch(/const/);
    // There should be exactly 4 lines (header, code, border, empty)
    expect(lines.length).toBe(4);
  });

  test('ends with newline for proper spacing after block', async () => {
    const result = await renderCodeBlock('const x = 1;', 'ts', {
      continuation: '↪',
      theme: 'catppuccin-frappe',
      useNerdFonts: false,
      width: 60,
      wrap: true
    });

    expect(result.endsWith('\n')).toBe(true);
  });
});
