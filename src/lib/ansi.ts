// src/lib/ansi.ts

// ANSI escape code pattern for stripping color codes
// biome-ignore lint/suspicious/noControlCharactersInRegex: ESC character required for ANSI stripping
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}

export function visibleLength(str: string): number {
  return stripAnsi(str).length;
}
