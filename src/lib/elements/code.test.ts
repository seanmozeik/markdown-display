// src/lib/elements/code.test.ts
import { describe, expect, test } from 'bun:test';
import { renderCodeBlock, renderInlineCode, wrapCodeLines } from './code';

describe('wrapCodeLines', () => {
  test('wraps long lines with continuation marker', () => {
    const code = 'x'.repeat(100);
    const result = wrapCodeLines(code, 50, '→');

    expect(result).toContain('→');
    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);
  });

  test('preserves short lines', () => {
    const code = 'short line';
    const result = wrapCodeLines(code, 80, '→');
    expect(result).toBe('short line');
  });

  test('preserves ANSI state across wrapped lines', () => {
    // Simulate syntax-highlighted string that wraps
    // \x1b[32m = basic green foreground
    const greenText = `\x1b[32m${'x'.repeat(100)}\x1b[0m`;
    const result = wrapCodeLines(greenText, 50, '→');

    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);

    // First line should have reset at the end
    expect(lines[0]).toContain('\x1b[0m');

    // Second line content should have the green color re-applied
    // (after the continuation marker which has its own styling)
    expect(lines[1]).toContain('\x1b[32m');
  });

  test('handles multiple ANSI styles (bold + color)', () => {
    // Bold (1) + green (32)
    const styledText = `\x1b[1;32m${'x'.repeat(100)}\x1b[0m`;
    const result = wrapCodeLines(styledText, 50, '→');

    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);

    // Second line should have both bold and color re-applied
    // The state is reconstructed as "1;32" (styles then color)
    expect(lines[1]).toMatch(/\x1b\[.*1.*m/); // Has bold
    expect(lines[1]).toMatch(/\x1b\[.*32.*m/); // Has green
  });

  test('preserves 256-color syntax highlighting (Shiki style)', () => {
    // Shiki uses 256-color mode: \x1b[38;5;Nm for foreground
    // Simulate a highlighted string literal in color 114 (light green)
    const shikiStyled = `\x1b[38;5;114m"this is a long string"${'x'.repeat(80)}\x1b[0m`;
    const result = wrapCodeLines(shikiStyled, 50, '→');

    const lines = result.split('\n');
    expect(lines.length).toBeGreaterThan(1);

    // First line ends with reset
    expect(lines[0]).toContain('\x1b[0m');

    // Second line should re-apply the 256-color: \x1b[38;5;114m
    expect(lines[1]).toContain('\x1b[38;5;114m');
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
