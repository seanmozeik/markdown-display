// src/lib/ansi.ts

// ANSI escape code pattern for stripping color codes
// biome-ignore lint/suspicious/noControlCharactersInRegex: ESC character required for ANSI stripping
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

// Soft hyphen - invisible until line break
const SOFT_HYPHEN_REGEX = /\u00AD/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}

export function stripInvisible(str: string): string {
  return stripAnsi(str).replace(SOFT_HYPHEN_REGEX, '');
}

export function visibleLength(str: string): number {
  return Bun.stringWidth(stripInvisible(str));
}
