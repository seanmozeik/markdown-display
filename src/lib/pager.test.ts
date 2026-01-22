// src/lib/pager.test.ts
import { afterEach, describe, expect, test } from 'bun:test';
import { countLines, getPagerCommand, PagingMode, shouldUsePager } from './pager';

describe('shouldUsePager', () => {
  test('returns Never when stdout is not TTY', () => {
    expect(shouldUsePager({ height: 50, lines: 100, stdinTTY: true, stdoutTTY: false })).toBe(
      PagingMode.Never
    );
  });

  test('returns Never when content fits in terminal', () => {
    expect(shouldUsePager({ height: 50, lines: 10, stdinTTY: true, stdoutTTY: true })).toBe(
      PagingMode.Never
    );
  });

  test('returns QuitIfOneScreen when content exceeds height', () => {
    expect(shouldUsePager({ height: 50, lines: 100, stdinTTY: true, stdoutTTY: true })).toBe(
      PagingMode.QuitIfOneScreen
    );
  });

  test('returns Never when noPager flag is true', () => {
    expect(
      shouldUsePager({ height: 50, lines: 100, noPager: true, stdinTTY: true, stdoutTTY: true })
    ).toBe(PagingMode.Never);
  });

  test('returns QuitIfOneScreen for piped stdin with TTY stdout (bat pattern)', () => {
    expect(shouldUsePager({ height: 50, lines: 100, stdinTTY: false, stdoutTTY: true })).toBe(
      PagingMode.QuitIfOneScreen
    );
  });
});

describe('getPagerCommand', () => {
  const originalPager = Bun.env.PAGER;
  const originalMdPager = Bun.env.MD_PAGER;

  afterEach(() => {
    if (originalPager) Bun.env.PAGER = originalPager;
    else delete Bun.env.PAGER;
    if (originalMdPager) Bun.env.MD_PAGER = originalMdPager;
    else delete Bun.env.MD_PAGER;
  });

  test('uses config command if provided', () => {
    const result = getPagerCommand({ args: [], command: 'more' });
    expect(result.command).toBe('more');
  });

  test('uses MD_PAGER over PAGER (bat pattern)', () => {
    Bun.env.MD_PAGER = 'most';
    Bun.env.PAGER = 'less';
    const result = getPagerCommand({ args: ['-R'], command: '' });
    expect(result.command).toBe('most');
  });

  test('uses PAGER if no MD_PAGER', () => {
    delete Bun.env.MD_PAGER;
    Bun.env.PAGER = 'most';
    const result = getPagerCommand({ args: ['-R'], command: '' });
    expect(result.command).toBe('most');
  });

  test('defaults to less with smart args', () => {
    delete Bun.env.PAGER;
    delete Bun.env.MD_PAGER;
    const result = getPagerCommand({ args: [], command: '' });
    expect(result.command).toBe('less');
    expect(result.args).toContain('-R'); // raw ANSI
  });
});

describe('countLines', () => {
  test('counts newlines in string', () => {
    expect(countLines('line1\nline2\nline3')).toBe(3);
  });

  test('handles empty string', () => {
    expect(countLines('')).toBe(1);
  });

  test('accounts for wrapped lines when width provided', () => {
    const longLine = 'a'.repeat(100);
    expect(countLines(longLine, 50)).toBe(2);
  });
});
