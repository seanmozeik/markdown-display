// Src/lib/ansi.ts

/**
 * ANSI / invisible character handling for terminal width and stripping.
 * Broader escape patterns adapted from claudewatch/src/render/measure.ts.
 */

const ESC = '\u001B';
const BEL = '\u0007';
const ANSI_PATTERN = new RegExp(
  `${ESC}\\[[0-9;]*m|${ESC}\\].*?${BEL}|${ESC}\\[[\\d;]*[A-Za-z]`,
  'gu',
);

const ZERO_WIDTH_PATTERN = /[\u0300-\u036F\u200B\u200C\uFEFF\u202A-\u202E]|\u200D/gu;

const SOFT_HYPHEN_REGEX = /\u00AD/gu;

export const stripAnsi = (str: string): string => str.replace(ANSI_PATTERN, '');

export const stripInvisible = (str: string): string =>
  stripAnsi(str).replace(SOFT_HYPHEN_REGEX, '').replace(ZERO_WIDTH_PATTERN, '');

export const visibleLength = (str: string): number => Bun.stringWidth(stripInvisible(str));
