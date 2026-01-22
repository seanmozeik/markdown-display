// src/lib/width.ts
const MIN_WIDTH = 40;
const MAX_AUTO_WIDTH = 120; // Cap for readability (from glow)
const DEFAULT_WIDTH = 80;

export function getTerminalWidth(override?: number): number {
  if (override !== undefined) {
    return Math.max(MIN_WIDTH, override);
  }

  const detected = process.stdout.columns ?? DEFAULT_WIDTH;
  return Math.max(MIN_WIDTH, Math.min(MAX_AUTO_WIDTH, detected));
}

export function getTerminalHeight(): number {
  return process.stdout.rows ?? 24;
}
