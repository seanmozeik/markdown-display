// Src/lib/ansi.ts

/**
 * ANSI / invisible character handling for terminal width and stripping.
 * Broader escape patterns adapted from claudewatch/src/render/measure.ts.
 */

// oxlint-disable-next-line no-control-regex
const ANSI_PATTERN = /\u001B\[[0-9;]*m|\u001B\].*?\u0007|\u001B\[[\d;]*[A-Za-z]/gu;

// oxlint-disable-next-line no-misleading-character-class
const ZERO_WIDTH_PATTERN = /[\u{0300}-\u{036F}\u{200B}\u{200C}\u{200D}\u{FEFF}\u{202A}-\u{202E}]/gu;

const SOFT_HYPHEN_REGEX = /\u00AD/g;

export const stripAnsi = (str: string): string => str.replace(ANSI_PATTERN, '');

export const stripInvisible = (str: string): string =>
  stripAnsi(str).replace(SOFT_HYPHEN_REGEX, '').replace(ZERO_WIDTH_PATTERN, '');

export const visibleLength = (str: string): number => Bun.stringWidth(stripInvisible(str));
