// src/ui/themes/ansi.test.ts
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  ansiBg,
  ansiBold,
  ansiFg,
  ansiFgBg,
  ansiFgTransition,
  ansiItalic,
  hexToAnsi256
} from './ansi';
import { resetColorCache, setColorConfig } from './color-support';

describe('hexToAnsi256', () => {
  test('converts pure red to ANSI 196', () => {
    expect(hexToAnsi256('#ff0000')).toBe(196);
  });

  test('converts pure green to ANSI 46', () => {
    expect(hexToAnsi256('#00ff00')).toBe(46);
  });

  test('converts pure blue to ANSI 21', () => {
    expect(hexToAnsi256('#0000ff')).toBe(21);
  });

  test('converts white to ANSI 231', () => {
    expect(hexToAnsi256('#ffffff')).toBe(231);
  });

  test('converts black to ANSI 16', () => {
    expect(hexToAnsi256('#000000')).toBe(16);
  });

  test('converts Catppuccin Frappe mauve #ca9ee6 to closest ANSI', () => {
    const result = hexToAnsi256('#ca9ee6');
    expect(result).toBeGreaterThanOrEqual(140);
    expect(result).toBeLessThanOrEqual(189);
  });

  test('handles lowercase hex', () => {
    expect(hexToAnsi256('#ff0000')).toBe(hexToAnsi256('#FF0000'));
  });
});

describe('ansiFg', () => {
  beforeEach(() => {
    resetColorCache();
  });

  afterEach(() => {
    resetColorCache();
    setColorConfig('auto');
  });

  test('outputs truecolor when level is 3', () => {
    setColorConfig(true);
    const style = ansiFg('#ff5500');
    const result = style('test');
    expect(result).toContain('\x1b[38;2;255;85;0m');
    expect(result).toContain('\x1b[0m');
  });

  test('outputs 256-color when level is 2', () => {
    setColorConfig(false);
    const style = ansiFg('#ff5500');
    const result = style('test');
    expect(result).toContain('\x1b[38;5;');
    expect(result).not.toContain('\x1b[38;2;');
  });
});

describe('ansiBg', () => {
  beforeEach(() => {
    resetColorCache();
  });

  afterEach(() => {
    resetColorCache();
    setColorConfig('auto');
  });

  test('outputs truecolor when level is 3', () => {
    setColorConfig(true);
    const style = ansiBg('#ff5500');
    const result = style('test');
    expect(result).toContain('\x1b[48;2;255;85;0m');
  });

  test('outputs 256-color when level is 2', () => {
    setColorConfig(false);
    const style = ansiBg('#ff5500');
    const result = style('test');
    expect(result).toContain('\x1b[48;5;');
    expect(result).not.toContain('\x1b[48;2;');
  });
});

describe('ansiFgBg', () => {
  beforeEach(() => {
    resetColorCache();
  });

  afterEach(() => {
    resetColorCache();
    setColorConfig('auto');
  });

  test('outputs truecolor for both fg and bg when level is 3', () => {
    setColorConfig(true);
    const style = ansiFgBg('#ff0000', '#0000ff');
    const result = style('test');
    expect(result).toContain('\x1b[38;2;255;0;0;48;2;0;0;255m');
  });

  test('outputs 256-color for both fg and bg when level is 2', () => {
    setColorConfig(false);
    const style = ansiFgBg('#ff0000', '#0000ff');
    const result = style('test');
    expect(result).toContain('\x1b[38;5;');
    expect(result).toContain(';48;5;');
  });
});

describe('ansiBold', () => {
  beforeEach(() => {
    resetColorCache();
  });

  afterEach(() => {
    resetColorCache();
    setColorConfig('auto');
  });

  test('outputs truecolor with bold when level is 3', () => {
    setColorConfig(true);
    const style = ansiBold('#ff5500');
    const result = style('test');
    expect(result).toContain('\x1b[1;38;2;255;85;0m');
  });

  test('outputs 256-color with bold when level is 2', () => {
    setColorConfig(false);
    const style = ansiBold('#ff5500');
    const result = style('test');
    expect(result).toContain('\x1b[1;38;5;');
  });
});

describe('ansiItalic', () => {
  beforeEach(() => {
    resetColorCache();
  });

  afterEach(() => {
    resetColorCache();
    setColorConfig('auto');
  });

  test('outputs truecolor with italic when level is 3', () => {
    setColorConfig(true);
    const style = ansiItalic('#ff5500');
    const result = style('test');
    expect(result).toContain('\x1b[3;38;2;255;85;0m');
  });

  test('outputs 256-color with italic when level is 2', () => {
    setColorConfig(false);
    const style = ansiItalic('#ff5500');
    const result = style('test');
    expect(result).toContain('\x1b[3;38;5;');
  });
});

describe('ansiFgTransition', () => {
  beforeEach(() => {
    resetColorCache();
  });

  afterEach(() => {
    resetColorCache();
    setColorConfig('auto');
  });

  test('outputs truecolor transition when level is 3', () => {
    setColorConfig(true);
    const style = ansiFgTransition('#ff0000', '#00ff00');
    const result = style('test');
    expect(result).toContain('\x1b[38;2;255;0;0m');
    expect(result).toContain('\x1b[38;2;0;255;0m');
    expect(result).not.toContain('\x1b[0m'); // No reset, transitions instead
  });

  test('outputs 256-color transition when level is 2', () => {
    setColorConfig(false);
    const style = ansiFgTransition('#ff0000', '#00ff00');
    const result = style('test');
    expect(result).toContain('\x1b[38;5;');
    expect(result).not.toContain('\x1b[38;2;');
  });
});
