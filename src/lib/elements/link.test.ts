// src/lib/elements/link.test.ts
import { afterEach, describe, expect, test } from 'bun:test';
import { renderLink, supportsOsc8 } from './link';

describe('renderLink', () => {
  test('renders OSC 8 hyperlink when enabled', () => {
    const result = renderLink('Click here', 'https://example.com', {
      osc8: true,
      show_urls: false
    });
    expect(result).toContain('\x1b]8;;https://example.com\x07');
    expect(result).toContain('Click here');
    expect(result).toContain('\x1b]8;;\x07');
  });

  test('renders plain link with URL when OSC 8 disabled', () => {
    const result = renderLink('Click here', 'https://example.com', {
      osc8: false,
      show_urls: false
    });
    expect(result).not.toContain('\x1b]8;;');
    expect(result).toContain('Click here');
    expect(result).toContain('https://example.com');
  });

  test('handles link with same text and URL', () => {
    const result = renderLink('https://example.com', 'https://example.com', {
      osc8: false,
      show_urls: false
    });
    const urlCount = (result.match(/example\.com/g) || []).length;
    expect(urlCount).toBe(1);
  });
});

describe('supportsOsc8', () => {
  const originalTermProgram = Bun.env.TERM_PROGRAM;

  afterEach(() => {
    if (originalTermProgram) Bun.env.TERM_PROGRAM = originalTermProgram;
    else delete Bun.env.TERM_PROGRAM;
  });

  test('returns true for known supporting terminals', () => {
    for (const term of ['iTerm.app', 'WezTerm', 'vscode']) {
      Bun.env.TERM_PROGRAM = term;
      expect(supportsOsc8()).toBe(true);
    }
  });

  test('returns false for unknown terminals', () => {
    Bun.env.TERM_PROGRAM = 'unknown-terminal';
    expect(supportsOsc8()).toBe(false);
  });
});
