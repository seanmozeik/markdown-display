// Src/ui/themes/color-support.test.ts
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { getColorLevel, resetColorCache, setColorConfig } from '../src/ui/themes/color-support';

describe('getColorLevel', () => {
  const originalNoColor = Bun.env.NO_COLOR;
  const originalForceColor = Bun.env.FORCE_COLOR;

  beforeEach(() => {
    resetColorCache();
  });

  afterEach(() => {
    if (originalNoColor === undefined) {
      delete Bun.env.NO_COLOR;
    } else {
      Bun.env.NO_COLOR = originalNoColor;
    }
    if (originalForceColor === undefined) {
      delete Bun.env.FORCE_COLOR;
    } else {
      Bun.env.FORCE_COLOR = originalForceColor;
    }
    resetColorCache();
    setColorConfig('auto');
  });

  test('returns 0 when NO_COLOR is set', () => {
    Bun.env.NO_COLOR = '1';
    resetColorCache();
    expect(getColorLevel()).toBe(0);
  });

  test('does not disable color when NO_COLOR is unset', () => {
    delete Bun.env.NO_COLOR;
    resetColorCache();
    setColorConfig(true);
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
    const second = getColorLevel();
    expect(first).toBe(second);
    expect(first).toBe(3);
  });

  test('resetColorCache clears the cache', () => {
    delete Bun.env.NO_COLOR;
    setColorConfig(true);
    getColorLevel();
    resetColorCache();
    setColorConfig(false);
    expect(getColorLevel()).toBe(2);
  });
});

describe('setColorConfig', () => {
  let restoreEnv: (() => void) | undefined;

  beforeEach(() => {
    const savedNoColor = Bun.env.NO_COLOR;
    const savedForce = Bun.env.FORCE_COLOR;
    delete Bun.env.NO_COLOR;
    delete Bun.env.FORCE_COLOR;
    restoreEnv = (): void => {
      if (savedNoColor === undefined) {
        delete Bun.env.NO_COLOR;
      } else {
        Bun.env.NO_COLOR = savedNoColor;
      }
      if (savedForce === undefined) {
        delete Bun.env.FORCE_COLOR;
      } else {
        Bun.env.FORCE_COLOR = savedForce;
      }
    };
    resetColorCache();
  });

  afterEach(() => {
    restoreEnv?.();
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
    expect(() => getColorLevel()).not.toThrow();
  });
});
