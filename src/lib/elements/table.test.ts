// src/lib/elements/table.test.ts
import { describe, expect, test } from 'bun:test';
import { renderTable } from './table';

function stripAnsi(str: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ESC character required for ANSI stripping
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('renderTable', () => {
  test('renders table with proper grid borders', () => {
    const result = renderTable(['Col1', 'Col2'], [['A', 'B']]);

    // console-table-printer uses box-drawing characters
    expect(result).toContain('┌');
    expect(result).toContain('┐');
    expect(result).toContain('└');
    expect(result).toContain('┘');
    expect(result).toContain('│');
  });

  test('renders header row', () => {
    const result = renderTable(['Name', 'Age'], [['Alice', '30']]);
    expect(result).toContain('Name');
    expect(result).toContain('Age');
  });

  test('renders data rows', () => {
    const result = renderTable(['H'], [['R1'], ['R2'], ['R3']]);
    expect(result).toContain('R1');
    expect(result).toContain('R2');
    expect(result).toContain('R3');
  });

  test('handles empty table', () => {
    const result = renderTable(['A', 'B'], []);
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  test('aligns columns properly', () => {
    const result = renderTable(
      ['Name', 'Value'],
      [
        ['Short', 'X'],
        ['Much Longer Name', 'Y']
      ]
    );
    // All rows should be aligned
    const lines = stripAnsi(result)
      .split('\n')
      .filter((l) => l.includes('│'));
    const lengths = lines.map((l) => l.length);
    expect(new Set(lengths).size).toBe(1); // All same length
  });
});
