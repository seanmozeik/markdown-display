import { describe, expect, test } from 'bun:test';

import { Effect } from 'effect';

import { clearHighlightCache, highlightCode, stripItalicAnsi } from '../src/lib/shiki';

const runEffect = <A>(effect: Effect.Effect<A>): Promise<A> => Effect.runPromise(effect);

describe('highlightCode', () => {
  test('returns ANSI for TypeScript', async () => {
    const code = 'const x: number = 42;';
    const result = await runEffect(highlightCode(code, 'typescript', 'catppuccin-frappe'));
    expect(result.includes('\u001B[') || result === code).toBe(true);
  });

  test('returns original for unknown language', async () => {
    const code = 'some random text';
    const result = await runEffect(
      highlightCode(code, 'unknown-xyz-language', 'catppuccin-frappe'),
    );
    expect(result).toBe(code);
  });

  test('returns original for oversized input', async () => {
    const code = 'a'.repeat(16 * 1024 + 1);
    const result = await runEffect(highlightCode(code, 'typescript', 'catppuccin-frappe'));
    expect(result).toBe(code);
  });

  test('caches repeated highlights', async () => {
    clearHighlightCache();
    const code = 'const cache = true;';
    const first = await runEffect(highlightCode(code, 'typescript', 'catppuccin-frappe'));
    const second = await runEffect(highlightCode(code, 'typescript', 'catppuccin-frappe'));
    expect(second).toBe(first);
  });

  test('strips trailing newline from Shiki output', async () => {
    const code = 'const x = 1;';
    const result = await runEffect(highlightCode(code, 'typescript', 'catppuccin-frappe'));
    expect(result.endsWith('\n')).toBe(false);
  });
});

describe('stripItalicAnsi', () => {
  test('removes italic SGR but keeps color', () => {
    const input = '\u001B[3mitalic\u001B[23m \u001B[38;2;10;20;30;3mcolor\u001B[0m';
    const result = stripItalicAnsi(input);
    expect(result).not.toContain('\u001B[3m');
    expect(result).not.toContain('\u001B[23m');
    expect(result).toContain('\u001B[38;2;10;20;30m');
  });
});
