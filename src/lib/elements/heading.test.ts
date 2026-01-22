import { describe, expect, test } from 'bun:test';
import { renderHeading } from './heading';

describe('renderHeading', () => {
  test('h1 renders in boxen container', () => {
    const result = renderHeading('Title', 1, 40);
    expect(result).toContain('Title');
    // Boxen uses box-drawing characters
    expect(result).toMatch(/[╭╮╯╰│─]/);
  });

  test('h2 has line decoration', () => {
    const result = renderHeading('Subtitle', 2, 40);
    expect(result).toContain('Subtitle');
    expect(result).toContain('─');
  });

  test('h3+ has no line decoration', () => {
    const result = renderHeading('Section', 3, 40);
    expect(result).toContain('Section');
    // Should not have boxen or line decoration
    expect(result).not.toMatch(/[╭╮╯╰]/);
  });

  test('adds appropriate vertical spacing', () => {
    const result = renderHeading('Title', 1, 40);
    expect(result.startsWith('\n')).toBe(true);
    expect(result.endsWith('\n')).toBe(true);
  });
});
