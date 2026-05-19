// Src/lib/width.ts
const MIN_WIDTH = 40;
const MAX_AUTO_WIDTH = 120;
const DEFAULT_WIDTH = 80;
const DEFAULT_TERMINAL_ROWS = 24;

export const getTerminalWidth = (override?: number): number => {
  if (override !== undefined) {
    return Math.max(MIN_WIDTH, override);
  }

  const detected = process.stdout.columns;
  const columns = detected > 0 ? detected : DEFAULT_WIDTH;
  return Math.max(MIN_WIDTH, Math.min(MAX_AUTO_WIDTH, columns));
};

export const getRawTerminalWidth = (): number =>
  process.stdout.columns > 0 ? process.stdout.columns : DEFAULT_WIDTH;

export const getTerminalHeight = (): number =>
  process.stdout.rows > 0 ? process.stdout.rows : DEFAULT_TERMINAL_ROWS;
