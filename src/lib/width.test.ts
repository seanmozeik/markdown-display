// src/lib/width.test.ts
import { afterEach, describe, expect, test } from 'bun:test';
import { getTerminalWidth } from './width';

describe('getTerminalWidth', () => {
  const originalColumns = process.stdout.columns;

  afterEach(() => {
    Object.defineProperty(process.stdout, 'columns', { value: originalColumns, writable: true });
  });

  test('returns terminal width when available', () => {
    Object.defineProperty(process.stdout, 'columns', { value: 100, writable: true });
    expect(getTerminalWidth()).toBe(100);
  });

  test('returns default 80 when columns undefined', () => {
    Object.defineProperty(process.stdout, 'columns', { value: undefined, writable: true });
    expect(getTerminalWidth()).toBe(80);
  });

  test('respects override parameter', () => {
    Object.defineProperty(process.stdout, 'columns', { value: 120, writable: true });
    expect(getTerminalWidth(60)).toBe(60);
  });

  test('clamps width to minimum 40', () => {
    expect(getTerminalWidth(20)).toBe(40);
  });

  test('caps width at 120 for readability (glow pattern)', () => {
    Object.defineProperty(process.stdout, 'columns', { value: 200, writable: true });
    expect(getTerminalWidth()).toBe(120);
  });

  test('override can exceed 120 if explicit', () => {
    expect(getTerminalWidth(150)).toBe(150);
  });
});
