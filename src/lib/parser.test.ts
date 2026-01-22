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
    const result = await parseMarkdown(md, { width: 80 });
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
    const result = await parseMarkdown(md, { osc8: false, width: 80 });
    expect(result).toContain('Example');
    expect(result).toContain('example.com');
  });

  test('parses tables', async () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const result = await parseMarkdown(md, { width: 80 });
    expect(result).toContain('┌');
    expect(result).toContain('A');
  });
});
