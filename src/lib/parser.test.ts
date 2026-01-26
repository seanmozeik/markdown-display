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

describe('ordered list start number', () => {
  test('respects start number for ordered lists', async () => {
    const md = `3. Third item
4. Fourth item
5. Fifth item`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('3.');
    expect(result).toContain('4.');
    expect(result).toContain('5.');
    expect(result).not.toContain('1.');
  });
});

describe('task lists', () => {
  test('renders unchecked task items', async () => {
    const md = `- [ ] Unchecked task`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('☐');
    expect(result).toContain('Unchecked task');
  });

  test('renders checked task items', async () => {
    const md = `- [x] Checked task`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('☑');
    expect(result).toContain('Checked task');
  });

  test('renders nested task lists', async () => {
    const md = `- [ ] Parent task
  - [x] Completed subtask
  - [ ] Pending subtask`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('☐');
    expect(result).toContain('☑');
  });
});

describe('nested lists', () => {
  test('renders nested unordered list with proper indentation', async () => {
    const md = `- Level 1
  - Level 2
    - Level 3`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    // Should have different bullets at each level
    expect(result).toContain('•'); // Level 1
    expect(result).toContain('◦'); // Level 2
    expect(result).toContain('▪'); // Level 3
  });

  test('renders nested ordered list', async () => {
    const md = `1. First
   1. Nested first
   2. Nested second`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('1.');
    expect(result).toContain('2.');
  });

  test('renders mixed nested lists', async () => {
    const md = `- Unordered
  1. Nested ordered
  2. Second ordered`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('•');
    expect(result).toContain('1.');
    expect(result).toContain('2.');
  });
});

describe('loose lists with block content', () => {
  test('renders loose list with nested task items', async () => {
    // Loose lists (blank lines between items) wrap content in paragraph tokens
    const md = `- [ ] Parent task
  - [x] Completed subtask
  - [ ] Pending subtask

- [ ] Another parent
  - [x] Done`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('☐');
    expect(result).toContain('☑');
    expect(result).toContain('Parent task');
    expect(result).toContain('Another parent');
  });

  test('renders list items containing code blocks', async () => {
    const md = `1. First item with code

   \`\`\`js
   const x = 1;
   \`\`\`

2. Second item`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('const'); // Code is syntax highlighted
    expect(result).toContain('javascript'); // Language label
  });

  test('renders list items containing blockquotes', async () => {
    const md = `- Item with quote

  > This is a blockquote inside a list

- Next item`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('•');
    expect(result).toContain('Item with quote');
    expect(result).toContain('blockquote');
    expect(result).toContain('Next item');
  });

  test('renders list items containing tables', async () => {
    const md = `- Item with table

  | Col1 | Col2 |
  |------|------|
  | A    | B    |

- Next item`;
    const result = await parseMarkdown(md, { hyphenation: false, width: 80 });
    expect(result).toContain('•');
    expect(result).toContain('Item with table');
    expect(result).toContain('Col1');
    expect(result).toContain('A');
    expect(result).toContain('Next item');
  });
});
