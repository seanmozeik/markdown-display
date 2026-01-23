// src/lib/parser.test.ts
import { describe, expect, test } from 'bun:test';
import { parseMarkdown } from './parser';

describe('parseMarkdown', () => {
  test('parses headings', async () => {
    const md = '# Hello World';
    const result = await parseMarkdown(md, { width: 80 });
    expect(result).toContain('Hello World');
  });

  test('parses paragraphs', async () => {
    const md = 'This is a paragraph.';
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('This is a paragraph');
  });

  test('parses code blocks', async () => {
    const md = '```ts\nconst x = 1\n```';
    const result = await parseMarkdown(md, { width: 80 });
    expect(result).toContain('const');
    expect(result).toContain('─');
  });

  test('parses links', async () => {
    const md = '[Example](https://example.com)';
    const result = await parseMarkdown(md, { hyphenation: false, osc8: false, width: 80 });
    expect(result).toContain('Example');
    expect(result).toContain('example.com');
  });

  test('parses tables', async () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const result = await parseMarkdown(md, { width: 80 });
    expect(result).toContain('┌');
    expect(result).toContain('A');
  });

  test('renders bold text with ANSI codes', async () => {
    const md = 'This is **bold** text';
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    // Should contain ANSI bold+color codes (combined format), not literal asterisks
    expect(result).toContain('\x1b[1;38;5;');
    expect(result).not.toContain('**');
  });

  test('renders italic text with ANSI codes', async () => {
    const md = 'This is *italic* text';
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    // Should contain ANSI italic+color codes (combined format), not literal asterisks
    expect(result).toContain('\x1b[3;38;5;');
    expect(result).not.toContain('*italic*');
  });

  test('renders bold in list items', async () => {
    const md = '- Item with **bold** text';
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('\x1b[1;38;5;');
    expect(result).not.toContain('**');
  });
});
