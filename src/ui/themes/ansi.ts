// Src/ui/themes/ansi.ts
import { getColorLevel } from './color-support';

const ESC = '\u001B';
const RESET = `${ESC}[0m`;

const ANSI_STANDARD_COUNT = 16;
const ANSI_CUBE_BASE = 16;
const ANSI_CUBE_SIZE = 36;
const ANSI_GRAYSCALE_BASE = 232;
const ANSI_PALETTE_SIZE = 256;
const RGB_MAX = 255;
const RGB_MID = 128;
const RGB_LIGHT = 192;
const CUBE_LEVELS = 6;
const CUBE_RGB_OFFSET = 55;
const CUBE_RGB_STEP = 40;
const GRAY_RAMP_START = 8;
const GRAY_RAMP_STEP = 10;

type Rgb = [number, number, number];

const STANDARD_ANSI_COLORS: readonly Rgb[] = [
  [0, 0, 0],
  [RGB_MID, 0, 0],
  [0, RGB_MID, 0],
  [RGB_MID, RGB_MID, 0],
  [0, 0, RGB_MID],
  [RGB_MID, 0, RGB_MID],
  [0, RGB_MID, RGB_MID],
  [RGB_LIGHT, RGB_LIGHT, RGB_LIGHT],
  [RGB_MID, RGB_MID, RGB_MID],
  [RGB_MAX, 0, 0],
  [0, RGB_MAX, 0],
  [RGB_MAX, RGB_MAX, 0],
  [0, 0, RGB_MAX],
  [RGB_MAX, 0, RGB_MAX],
  [0, RGB_MAX, RGB_MAX],
  [RGB_MAX, RGB_MAX, RGB_MAX],
] as const;

const cubeComponentToRgb = (value: number): number =>
  value === 0 ? 0 : CUBE_RGB_OFFSET + value * CUBE_RGB_STEP;

/**
 * ANSI 256-color palette RGB values.
 * Colors 0-15: Standard colors (system-dependent, skip)
 * Colors 16-231: 6x6x6 color cube
 * Colors 232-255: Grayscale ramp
 */
const getAnsi256Color = (code: number): Rgb => {
  if (code < ANSI_STANDARD_COUNT) {
    const color = STANDARD_ANSI_COLORS[code];
    return color ?? [0, 0, 0];
  }

  if (code < ANSI_GRAYSCALE_BASE) {
    const idx = code - ANSI_CUBE_BASE;
    const r = Math.floor(idx / ANSI_CUBE_SIZE);
    const g = Math.floor((idx % ANSI_CUBE_SIZE) / CUBE_LEVELS);
    const b = idx % CUBE_LEVELS;
    return [cubeComponentToRgb(r), cubeComponentToRgb(g), cubeComponentToRgb(b)];
  }

  const gray = GRAY_RAMP_START + (code - ANSI_GRAYSCALE_BASE) * GRAY_RAMP_STEP;
  return [gray, gray, gray];
};

const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace('#', '').toLowerCase();
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
};

const colorDistance = ([r1, g1, b1]: Rgb, [r2, g2, b2]: Rgb): number =>
  (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;

const hexToAnsi256 = (hex: string): number => {
  const target = hexToRgb(hex);
  let closest = ANSI_CUBE_BASE;
  let minDist = Infinity;

  for (let i = ANSI_CUBE_BASE; i < ANSI_PALETTE_SIZE; i += 1) {
    const dist = colorDistance(target, getAnsi256Color(i));
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  }

  return closest;
};

const ansiFg = (hex: string): ((text: string) => string) => {
  if (getColorLevel() >= 3) {
    const [r, g, b] = hexToRgb(hex);
    return (text: string) => `${ESC}[38;2;${r};${g};${b}m${text}${RESET}`;
  }
  const code = hexToAnsi256(hex);
  return (text: string) => `${ESC}[38;5;${code}m${text}${RESET}`;
};

const ansiBg = (hex: string): ((text: string) => string) => {
  if (getColorLevel() >= 3) {
    const [r, g, b] = hexToRgb(hex);
    return (text: string) => `${ESC}[48;2;${r};${g};${b}m${text}${RESET}`;
  }
  const code = hexToAnsi256(hex);
  return (text: string) => `${ESC}[48;5;${code}m${text}${RESET}`;
};

const ansiFgBg = (fgHex: string, bgHex: string): ((text: string) => string) => {
  if (getColorLevel() >= 3) {
    const [fgR, fgG, fgB] = hexToRgb(fgHex);
    const [bgR, bgG, bgB] = hexToRgb(bgHex);
    return (text: string) =>
      `${ESC}[38;2;${fgR};${fgG};${fgB};48;2;${bgR};${bgG};${bgB}m${text}${RESET}`;
  }
  const fgCode = hexToAnsi256(fgHex);
  const bgCode = hexToAnsi256(bgHex);
  return (text: string) => `${ESC}[38;5;${fgCode};48;5;${bgCode}m${text}${RESET}`;
};

const ansiBold = (hex: string): ((text: string) => string) => {
  if (getColorLevel() >= 3) {
    const [r, g, b] = hexToRgb(hex);
    return (text: string) => `${ESC}[1;38;2;${r};${g};${b}m${text}${RESET}`;
  }
  const code = hexToAnsi256(hex);
  return (text: string) => `${ESC}[1;38;5;${code}m${text}${RESET}`;
};

const ansiItalic = (hex: string): ((text: string) => string) => {
  if (getColorLevel() >= 3) {
    const [r, g, b] = hexToRgb(hex);
    return (text: string) => `${ESC}[3;38;2;${r};${g};${b}m${text}${RESET}`;
  }
  const code = hexToAnsi256(hex);
  return (text: string) => `${ESC}[3;38;5;${code}m${text}${RESET}`;
};

/**
 * Style text with foreground color, transitioning to another color instead of resetting.
 * Useful for styled text embedded in colored contexts (like box titles in borders).
 */
const ansiFgTransition = (fgHex: string, transitionHex: string): ((text: string) => string) => {
  if (getColorLevel() >= 3) {
    const [fgR, fgG, fgB] = hexToRgb(fgHex);
    const [trR, trG, trB] = hexToRgb(transitionHex);
    return (text: string) =>
      `${ESC}[38;2;${fgR};${fgG};${fgB}m${text}${ESC}[38;2;${trR};${trG};${trB}m`;
  }
  const fgCode = hexToAnsi256(fgHex);
  const trCode = hexToAnsi256(transitionHex);
  return (text: string) => `${ESC}[38;5;${fgCode}m${text}${ESC}[38;5;${trCode}m`;
};

export { ansiBg, ansiBold, ansiFg, ansiFgBg, ansiFgTransition, ansiItalic, hexToAnsi256, hexToRgb };
