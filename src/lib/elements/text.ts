// src/lib/elements/text.ts
import { hyphenateSync } from 'hyphen/en';
import { getTextColor } from '../../ui/themes/semantic';
import { visibleLength } from '../ansi';

interface TextConfig {
  width: number;
  hyphenation: boolean;
  locale?: string;
}

interface WrapOptions {
  hyphenation: boolean;
  locale: string;
}

const SOFT_HYPHEN = '\u00AD';
const SOFT_HYPHEN_REGEX = /\u00AD/g;

function stripSoftHyphens(text: string): string {
  return text.replace(SOFT_HYPHEN_REGEX, '');
}

function hyphenateText(text: string): string {
  return hyphenateSync(text);
}

function findSoftHyphenPositions(text: string): number[] {
  const positions: number[] = [];
  let idx = text.indexOf(SOFT_HYPHEN);
  while (idx !== -1) {
    positions.push(idx);
    idx = text.indexOf(SOFT_HYPHEN, idx + 1);
  }
  return positions;
}

/**
 * Find the best soft hyphen break point that fits within maxWidth.
 * Returns the position, or -1 if no suitable break exists.
 */
function findBestBreakPoint(text: string, maxWidth: number): number {
  const positions = findSoftHyphenPositions(text);
  let best = -1;
  for (const pos of positions) {
    const beforeBreak = text.slice(0, pos);
    // +1 for the visible hyphen we'll add
    if (visibleLength(stripSoftHyphens(beforeBreak)) + 1 <= maxWidth) {
      best = pos;
    }
  }
  return best;
}

/**
 * Try to split a word at a syllable boundary to fill remaining line space.
 * Returns [partThatFits, remainder] if a good break point exists, or null if not.
 */
function trySplitWordToFill(
  word: string,
  remainingSpace: number,
  width: number
): [string, string] | null {
  // More aggressive hyphenation for narrow widths
  // Narrow (< 50): fill even with 2 chars
  // Wide (>= 50): need at least 3 chars to be worth it
  const minFragment = width < 50 ? 2 : 3;
  if (remainingSpace < minFragment) return null;

  const breakAt = findBestBreakPoint(word, remainingSpace);
  if (breakAt <= 0) return null;

  return [`${stripSoftHyphens(word.slice(0, breakAt))}-`, word.slice(breakAt + 1)];
}

export function wrapText(text: string, width: number, options?: WrapOptions): string {
  const shouldHyphenate = options?.hyphenation ?? false;

  // Insert soft hyphens at syllable boundaries if hyphenation enabled
  const processedText = shouldHyphenate ? hyphenateText(text) : text;

  const words = processedText.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (visibleLength(testLine) <= width) {
      // Word fits - strip soft hyphens since we don't need to break here
      const cleanWord = stripSoftHyphens(word);
      currentLine = currentLine ? `${currentLine} ${cleanWord}` : cleanWord;
    } else if (currentLine) {
      // Word doesn't fit - try to split it to fill current line
      const remainingSpace = width - visibleLength(currentLine) - 1; // -1 for space
      const split = shouldHyphenate ? trySplitWordToFill(word, remainingSpace, width) : null;

      if (split) {
        // Fill current line with first part of word
        const [firstPart, remainder] = split;
        lines.push(`${stripSoftHyphens(currentLine)} ${firstPart}`);
        // Continue with remainder (may need further breaking)
        currentLine = breakWord(remainder, width);
      } else {
        // Can't split usefully - push current line and start fresh
        lines.push(stripSoftHyphens(currentLine));
        currentLine = breakWord(word, width);
      }
    } else {
      // Word alone is too long - break it
      const broken = breakWord(word, width);
      const brokenLines = broken.split('\n');
      lines.push(...brokenLines.slice(0, -1));
      currentLine = brokenLines[brokenLines.length - 1] ?? '';
    }
  }

  if (currentLine) {
    // Strip any remaining soft hyphens from the last line
    lines.push(stripSoftHyphens(currentLine));
  }

  return lines.join('\n');
}

function breakWord(word: string, width: number): string {
  const lines: string[] = [];
  let remaining = word;

  while (visibleLength(remaining) > width) {
    const breakAt = findBestBreakPoint(remaining, width);

    if (breakAt > 0) {
      lines.push(`${stripSoftHyphens(remaining.slice(0, breakAt))}-`);
      remaining = remaining.slice(breakAt + 1);
    } else {
      lines.push(stripSoftHyphens(remaining.slice(0, width)));
      remaining = remaining.slice(width);
    }
  }

  if (remaining) {
    lines.push(stripSoftHyphens(remaining));
  }

  return lines.join('\n');
}

export function renderText(text: string, config: TextConfig): string {
  const wrapped = wrapText(text, config.width, {
    hyphenation: config.hyphenation,
    locale: config.locale ?? 'en-us'
  });
  const textColor = getTextColor();
  return `${textColor(wrapped)}\n`;
}
