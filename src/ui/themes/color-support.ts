// Src/ui/themes/color-support.ts
import supportsColor from 'supports-color';

type ColorLevel = 0 | 1 | 2 | 3;

let cachedLevel: ColorLevel | null = null;
let configOverride: boolean | 'auto' = 'auto';

/**
 * Initialize color environment on module load.
 * Syncs NO_COLOR to FORCE_COLOR for chalk/boxen consistency.
 */
const initColorEnvironment = (): void => {
  const noColorEnv = Bun.env.NO_COLOR !== undefined && Bun.env.NO_COLOR !== '';
  const noColorFlag = process.argv.includes('--no-color');

  if (noColorEnv || noColorFlag) {
    Bun.env.FORCE_COLOR = '0';
  }
};

initColorEnvironment();

/**
 * Set color configuration override.
 * @param truecolor - true for truecolor, false for 256-color, 'auto' for detection
 */
const setColorConfig = (truecolor: boolean | 'auto'): void => {
  configOverride = truecolor;
  cachedLevel = null;

  if (truecolor === true) {
    Bun.env.FORCE_COLOR = '3';
  } else if (truecolor === false) {
    Bun.env.FORCE_COLOR = '2';
  }
};

/** Reset the cached color level. Useful for testing. */
const resetColorCache = (): void => {
  cachedLevel = null;
};

const detectAutoColorLevel = (): ColorLevel => {
  const force = Bun.env.FORCE_COLOR;
  if (force === '0') {
    return 0;
  }
  if (force === '1') {
    return 1;
  }
  if (force === '2') {
    return 2;
  }
  if (force === '3') {
    return 3;
  }

  if (!process.stdout.isTTY) {
    return 0;
  }

  const colorterm = Bun.env['COLORTERM'];
  if (colorterm === 'truecolor' || colorterm === '24bit') {
    return 3;
  }

  const term = Bun.env['TERM'] ?? '';
  if (term.includes('256color')) {
    return 2;
  }

  const detected = supportsColor.stdout;
  if (detected === false) {
    return 0;
  }
  return detected.level as ColorLevel;
};

/** Get the current color level: 0 (none), 1 (basic), 2 (256), or 3 (truecolor). */
const getColorLevel = (): ColorLevel => {
  if (cachedLevel !== null) {
    return cachedLevel;
  }

  let level: ColorLevel;

  if (Bun.env.NO_COLOR !== undefined && Bun.env.NO_COLOR !== '') {
    level = 0;
  } else if (configOverride === true) {
    level = 3;
  } else if (configOverride === false) {
    level = 2;
  } else {
    level = detectAutoColorLevel();
  }

  cachedLevel = level;
  return level;
};

/** Check if truecolor is supported. */
const supportsTruecolor = (): boolean => getColorLevel() >= 3;

export type { ColorLevel };
export { getColorLevel, resetColorCache, setColorConfig, supportsTruecolor };
