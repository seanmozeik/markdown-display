// src/lib/elements/list.test.ts
import { describe, expect, test } from 'bun:test';
import { visibleLength } from '../ansi';
import { renderList, renderListItem } from './list';

describe('renderListItem', () => {
  test('renders bullet item with bullet character', () => {
    const result = renderListItem('Item text', false, 0);
    expect(result).toContain('•');
    expect(result).toContain('Item text');
  });

  test('renders ordered item with number', () => {
    const result = renderListItem('Item text', true, 0, 1);
    expect(result).toContain('1.');
    expect(result).toContain('Item text');
  });

  test('indents nested items', () => {
    const depth0 = renderListItem('Top', false, 0);
    const depth1 = renderListItem('Nested', false, 1);

    const indent0 = depth0.match(/^(\s*)/)?.[1]?.length ?? 0;
    const indent1 = depth1.match(/^(\s*)/)?.[1]?.length ?? 0;

    expect(indent1).toBeGreaterThan(indent0);
  });
});

describe('renderList', () => {
  test('renders unordered list', () => {
    const items = ['First', 'Second', 'Third'];
    const result = renderList(items, false);

    expect(result).toContain('•');
    expect(result).toContain('First');
    expect(result).toContain('Second');
  });

  test('renders ordered list with sequential numbers', () => {
    const items = ['First', 'Second', 'Third'];
    const result = renderList(items, true);

    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('3.');
  });
});

describe('task list items', () => {
  test('renders unchecked task with checkbox', () => {
    const result = renderListItem('Todo item', false, 0, undefined, { checked: false, task: true });
    expect(result).toContain('☐');
    expect(result).toContain('Todo item');
    expect(result).not.toContain('•');
  });

  test('renders checked task with checkbox', () => {
    const result = renderListItem('Done item', false, 0, undefined, { checked: true, task: true });
    expect(result).toContain('☑');
    expect(result).toContain('Done item');
  });

  test('renders nerd font checkbox when enabled', () => {
    const unchecked = renderListItem('Todo', false, 0, undefined, {
      checked: false,
      nerdFonts: true,
      task: true
    });
    const checked = renderListItem('Done', false, 0, undefined, {
      checked: true,
      nerdFonts: true,
      task: true
    });
    expect(unchecked).toContain('󰄱'); // nf-md-checkbox_blank_outline
    expect(checked).toContain('󰱒'); // nf-md-checkbox_marked
  });

  test('mutes text for completed tasks', () => {
    const result = renderListItem('Done item', false, 0, undefined, { checked: true, task: true });
    // Should contain muted ANSI color code (the muted color from theme)
    expect(result).toContain('\x1b[38;5;');
  });
});

describe('list item wrapping', () => {
  test('wraps long list items when width is provided', () => {
    const longText =
      'This is a very long list item that should wrap to multiple lines when width is constrained';
    const result = renderListItem(longText, false, 0, undefined, { width: 40 });
    const lines = result.split('\n');
    // Should have multiple lines
    expect(lines.length).toBeGreaterThan(1);
    // Each line should respect width (use visibleLength to ignore ANSI codes)
    for (const line of lines) {
      expect(visibleLength(line)).toBeLessThanOrEqual(40);
    }
  });

  test('indents continuation lines to align with text', () => {
    const longText = 'First line content and second line content here';
    const result = renderListItem(longText, false, 0, undefined, { width: 25 });
    const lines = result.split('\n');
    // First line has bullet, continuation lines should be indented to align
    if (lines.length > 1) {
      // Continuation line should start with spaces to align under text
      expect(lines[1]).toMatch(/^\s+/);
    }
  });
});
