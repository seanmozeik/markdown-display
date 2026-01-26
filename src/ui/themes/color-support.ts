// src/ui/themes/color-support.ts
import supportsColor from 'supports-color';

export type ColorLevel = 0 | 1 | 2 | 3;

let cachedLevel: ColorLevel | null = null;
let configOverride: boolean | 'auto' = 'auto';

/**
 * Initialize color environment on module load.
 * Syncs NO_COLOR to FORCE_COLOR for chalk/boxen consistency.
 */
function initColorEnvironment(): void {
  const noColorEnv = Bun.env.NO_COLOR !== undefined && Bun.env.NO_COLOR !== '';
  const noColorFlag = process.argv.includes('--no-color');

  if (noColorEnv || noColorFlag) {
    Bun.env.FORCE_COLOR = '0';
  }
}

// Run on module load
initColorEnvironment();

/**
 * Set color configuration override.
 * @param truecolor - true for truecolor, false for 256-color, 'auto' for detection
 */
export function setColorConfig(truecolor: boolean | 'auto'): void {
  configOverride = truecolor;
  cachedLevel = null;

  // Sync to FORCE_COLOR so chalk/gradient-string respect our config
  if (truecolor === true) {
    Bun.env.FORCE_COLOR = '3';
  } else if (truecolor === false) {
    Bun.env.FORCE_COLOR = '2';
  }
  // 'auto' leaves FORCE_COLOR as-is for natural detection
}

/**
 * Reset the cached color level. Useful for testing.
 */
export function resetColorCache(): void {
  cachedLevel = null;
}

/**
 * Get the current color level.
 * @returns 0 (no color), 1 (basic), 2 (256), or 3 (truecolor)
 */
export function getColorLevel(): ColorLevel {
  if (cachedLevel !== null) return cachedLevel;

  let level: ColorLevel;

  // NO_COLOR standard (no-color.org) - highest priority
  if (Bun.env.NO_COLOR !== undefined && Bun.env.NO_COLOR !== '') {
    level = 0;
  } else if (configOverride === true) {
    level = 3;
  } else if (configOverride === false) {
    level = 2;
  } else {
    // Auto-detect via supports-color
    const detected = supportsColor.stdout;
    level = detected ? (detected.level as ColorLevel) : 0;
  }

  cachedLevel = level;
  return level;
}

/**
 * Check if truecolor is supported.
 */
export function supportsTruecolor(): boolean {
  return getColorLevel() >= 3;
}
