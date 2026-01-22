// src/lib/elements/list.test.ts
import { describe, expect, test } from 'bun:test';
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
