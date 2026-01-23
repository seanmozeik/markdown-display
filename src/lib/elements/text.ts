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

function hyphenateText(text: string): string {
  return hyphenateSync(text);
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

  // Find all soft hyphen positions
  const softHyphenPositions: number[] = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] === SOFT_HYPHEN) {
      softHyphenPositions.push(i);
    }
  }

  if (softHyphenPositions.length === 0) return null;

  // Find best break point (last soft hyphen that fits with visible hyphen)
  let bestBreak = -1;
  for (const pos of softHyphenPositions) {
    const beforeBreak = word.slice(0, pos);
    // +1 for the visible hyphen we'll add
    if (visibleLength(beforeBreak.replace(/\u00AD/g, '')) + 1 <= remainingSpace) {
      bestBreak = pos;
    }
  }

  if (bestBreak <= 0) return null;

  const firstPart = `${word.slice(0, bestBreak).replace(/\u00AD/g, '')}-`;
  const remainder = word.slice(bestBreak + 1); // Skip the soft hyphen

  return [firstPart, remainder];
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
      const cleanWord = word.replace(/\u00AD/g, '');
      currentLine = currentLine ? `${currentLine} ${cleanWord}` : cleanWord;
    } else if (currentLine) {
      // Word doesn't fit - try to split it to fill current line
      const remainingSpace = width - visibleLength(currentLine) - 1; // -1 for space
      const split = shouldHyphenate ? trySplitWordToFill(word, remainingSpace, width) : null;

      if (split) {
        // Fill current line with first part of word
        const [firstPart, remainder] = split;
        lines.push(`${currentLine.replace(/\u00AD/g, '')} ${firstPart}`);
        // Continue with remainder (may need further breaking)
        currentLine = breakWord(remainder, width);
      } else {
        // Can't split usefully - push current line and start fresh
        lines.push(currentLine.replace(/\u00AD/g, ''));
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
    lines.push(currentLine.replace(/\u00AD/g, ''));
  }

  return lines.join('\n');
}

function breakWord(word: string, width: number): string {
  const lines: string[] = [];
  let remaining = word;

  while (visibleLength(remaining) > width) {
    // Find soft hyphen positions
    const softHyphenPositions: number[] = [];
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i] === SOFT_HYPHEN) {
        softHyphenPositions.push(i);
      }
    }

    // Find best break point (last soft hyphen that fits with visible hyphen)
    let breakAt = -1;
    for (const pos of softHyphenPositions) {
      const beforeBreak = remaining.slice(0, pos);
      // +1 for the visible hyphen we'll add
      if (visibleLength(beforeBreak) + 1 <= width) {
        breakAt = pos;
      }
    }

    if (breakAt > 0) {
      // Break at soft hyphen, replace with visible hyphen
      const beforeBreak = remaining.slice(0, breakAt).replace(/\u00AD/g, '');
      lines.push(`${beforeBreak}-`);
      remaining = remaining.slice(breakAt + 1); // Skip the soft hyphen
    } else {
      // No suitable soft hyphen - hard break
      const chunk = remaining.slice(0, width);
      lines.push(chunk.replace(/\u00AD/g, ''));
      remaining = remaining.slice(width);
    }
  }

  // Remove remaining soft hyphens from last chunk
  if (remaining) {
    lines.push(remaining.replace(/\u00AD/g, ''));
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
