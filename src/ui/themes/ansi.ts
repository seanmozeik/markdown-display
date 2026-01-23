// src/ui/themes/ansi.ts

/**
 * ANSI 256-color palette RGB values.
 * Colors 0-15: Standard colors (system-dependent, skip)
 * Colors 16-231: 6x6x6 color cube
 * Colors 232-255: Grayscale ramp
 */
function getAnsi256Color(code: number): [number, number, number] {
  if (code < 16) {
    const standard: [number, number, number][] = [
      [0, 0, 0],
      [128, 0, 0],
      [0, 128, 0],
      [128, 128, 0],
      [0, 0, 128],
      [128, 0, 128],
      [0, 128, 128],
      [192, 192, 192],
      [128, 128, 128],
      [255, 0, 0],
      [0, 255, 0],
      [255, 255, 0],
      [0, 0, 255],
      [255, 0, 255],
      [0, 255, 255],
      [255, 255, 255]
    ];
    // biome-ignore lint/style/noNonNullAssertion: code is guaranteed 0-15 by guard above
    return standard[code]!;
  }

  if (code < 232) {
    const idx = code - 16;
    const r = Math.floor(idx / 36);
    const g = Math.floor((idx % 36) / 6);
    const b = idx % 6;
    const toRgb = (v: number) => (v === 0 ? 0 : 55 + v * 40);
    return [toRgb(r), toRgb(g), toRgb(b)];
  }

  const gray = 8 + (code - 232) * 10;
  return [gray, gray, gray];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').toLowerCase();
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function colorDistance(
  [r1, g1, b1]: [number, number, number],
  [r2, g2, b2]: [number, number, number]
): number {
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

export function hexToAnsi256(hex: string): number {
  const target = hexToRgb(hex);
  let closest = 16;
  let minDist = Infinity;

  for (let i = 16; i < 256; i++) {
    const dist = colorDistance(target, getAnsi256Color(i));
    if (dist < minDist) {
      minDist = dist;
      closest = i;
    }
  }

  return closest;
}

export function ansiFg(hex: string): (text: string) => string {
  const code = hexToAnsi256(hex);
  return (text: string) => `\x1b[38;5;${code}m${text}\x1b[0m`;
}

export function ansiBg(hex: string): (text: string) => string {
  const code = hexToAnsi256(hex);
  return (text: string) => `\x1b[48;5;${code}m${text}\x1b[0m`;
}

export function ansiFgBg(fgHex: string, bgHex: string): (text: string) => string {
  const fgCode = hexToAnsi256(fgHex);
  const bgCode = hexToAnsi256(bgHex);
  return (text: string) => `\x1b[38;5;${fgCode};48;5;${bgCode}m${text}\x1b[0m`;
}

export function ansiBold(hex: string): (text: string) => string {
  const code = hexToAnsi256(hex);
  return (text: string) => `\x1b[1;38;5;${code}m${text}\x1b[0m`;
}

export function ansiItalic(hex: string): (text: string) => string {
  const code = hexToAnsi256(hex);
  return (text: string) => `\x1b[3;38;5;${code}m${text}\x1b[0m`;
}
