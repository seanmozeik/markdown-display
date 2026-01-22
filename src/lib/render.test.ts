// src/lib/render.test.ts
import { describe, expect, test } from 'bun:test';
import { DEFAULT_CONFIG } from './config';
import { render } from './render';

describe('render', () => {
  test('renders markdown string to ANSI', async () => {
    const md = '# Hello\n\nWorld';
    const result = await render(md, DEFAULT_CONFIG);

    expect(result).toContain('Hello');
    expect(result).toContain('World');
    expect(result).toContain('\x1b[');
  });

  test('handles empty input', async () => {
    const result = await render('', DEFAULT_CONFIG);
    expect(result).toBe('');
  });
});
