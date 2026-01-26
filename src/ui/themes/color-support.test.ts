// src/ui/themes/color-support.test.ts
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { getColorLevel, resetColorCache, setColorConfig } from './color-support';

describe('getColorLevel', () => {
  const originalNoColor = Bun.env.NO_COLOR;
  const originalForceColor = Bun.env.FORCE_COLOR;

  beforeEach(() => {
    resetColorCache();
  });

  afterEach(() => {
    // Restore environment
    if (originalNoColor !== undefined) Bun.env.NO_COLOR = originalNoColor;
    else delete Bun.env.NO_COLOR;
    if (originalForceColor !== undefined) Bun.env.FORCE_COLOR = originalForceColor;
    else delete Bun.env.FORCE_COLOR;
    resetColorCache();
    setColorConfig('auto');
  });

  test('returns 0 when NO_COLOR is set', () => {
    Bun.env.NO_COLOR = '1';
    resetColorCache();
    expect(getColorLevel()).toBe(0);
  });

  test('does not disable color when NO_COLOR is unset', () => {
    // When NO_COLOR is not set, config override should work
    delete Bun.env.NO_COLOR;
    resetColorCache();
    setColorConfig(true); // Force truecolor
    expect(getColorLevel()).toBe(3);
  });

  test('returns 3 when config forces truecolor', () => {
    delete Bun.env.NO_COLOR;
    resetColorCache();
    setColorConfig(true);
    expect(getColorLevel()).toBe(3);
  });

  test('returns 2 when config forces 256-color', () => {
    delete Bun.env.NO_COLOR;
    resetColorCache();
    setColorConfig(false);
    expect(getColorLevel()).toBe(2);
  });

  test('caches result after first call', () => {
    delete Bun.env.NO_COLOR;
    resetColorCache();
    setColorConfig(true);
    const first = getColorLevel();
    // Call again without changing config - should return cached value
    const second = getColorLevel();
    expect(first).toBe(second);
    expect(first).toBe(3);
  });

  test('resetColorCache clears the cache', () => {
    delete Bun.env.NO_COLOR;
    setColorConfig(true);
    getColorLevel(); // Cache level 3
    resetColorCache();
    setColorConfig(false);
    expect(getColorLevel()).toBe(2); // Now should be 2
  });
});

describe('setColorConfig', () => {
  afterEach(() => {
    resetColorCache();
    setColorConfig('auto');
  });

  test('accepts boolean true', () => {
    setColorConfig(true);
    expect(getColorLevel()).toBe(3);
  });

  test('accepts boolean false', () => {
    setColorConfig(false);
    expect(getColorLevel()).toBe(2);
  });

  test('accepts "auto" string', () => {
    setColorConfig('auto');
    // Should not throw, result depends on terminal
    expect(() => getColorLevel()).not.toThrow();
  });
});
