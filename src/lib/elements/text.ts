/// <reference path="../../hyphen.d.ts" />
import { hyphenateSync } from 'hyphen/en';

// Src/lib/elements/text.ts
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
const SOFT_HYPHEN_REGEX = /\u00AD/gu;

// ANSI escape character - used to build regex dynamically to satisfy linter
const ESC = '\u001B';

// Matches ANSI-styled content: \u001B[...m (content) \u001B[0m
const ANSI_STYLED_BLOCK = new RegExp(`${ESC}\\[[0-9;]*m[^${ESC}]*${ESC}\\[0m`, 'gu');

// Marker for preserving ANSI blocks during splitting (uses NUL which won't appear in text)
const NUL = '\u0000';
const MARKER_REGEX = new RegExp(`${NUL}ANSI(\\d+)${NUL}`, 'gu');

const NARROW_WRAP_WIDTH = 50;

/**
 * Split text into words while keeping ANSI-styled content as atomic units.
 * This prevents inline code backgrounds from bleeding when text wraps.
 */
const splitPreservingAnsi = (text: string): string[] => {
  const styledBlocks: string[] = [];
  const markedText = text.replace(ANSI_STYLED_BLOCK, (match) => {
    styledBlocks.push(match);
    return `${NUL}ANSI${styledBlocks.length - 1}${NUL}`;
  });

  const parts = markedText.split(/\s+/u);

  return parts.map((part) =>
    part.replace(MARKER_REGEX, (_, idx) => styledBlocks[Number(idx)] ?? ''),
  );
};

const stripSoftHyphens = (text: string): string => {
  return text.replace(SOFT_HYPHEN_REGEX, '');
};

const hyphenateText = (text: string): string => {
  return hyphenateSync(text);
};

/**
 * Hyphenate text while preserving ANSI-styled blocks (like inline code).
 * Only plain text segments get hyphenated; styled blocks pass through unchanged.
 */
const hyphenatePreservingAnsi = (text: string): string => {
  // Split into segments: [plain, styled, plain, styled, ...]
  const segments: string[] = [];
  let lastIndex = 0;

  // Reset regex state
  ANSI_STYLED_BLOCK.lastIndex = 0;

  for (
    let match = ANSI_STYLED_BLOCK.exec(text);
    match !== null;
    match = ANSI_STYLED_BLOCK.exec(text)
  ) {
    // Plain text before this styled block
    if (match.index > lastIndex) {
      segments.push(hyphenateText(text.slice(lastIndex, match.index)));
    }
    // The styled block itself (unchanged)
    segments.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text after last styled block
  if (lastIndex < text.length) {
    segments.push(hyphenateText(text.slice(lastIndex)));
  }

  return segments.join('');
};

const findSoftHyphenPositions = (text: string): number[] => {
  const positions: number[] = [];
  let idx = text.indexOf(SOFT_HYPHEN);
  while (idx !== -1) {
    positions.push(idx);
    idx = text.indexOf(SOFT_HYPHEN, idx + 1);
  }
  return positions;
};

/**
 * Find the best soft hyphen break point that fits within maxWidth.
 * Returns the position, or -1 if no suitable break exists.
 */
const findBestBreakPoint = (text: string, maxWidth: number): number => {
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
};

/**
 * Try to split a word at a syllable boundary to fill remaining line space.
 * Returns [partThatFits, remainder] if a good break point exists, or null if not.
 */
const trySplitWordToFill = (
  word: string,
  remainingSpace: number,
  width: number,
): [string, string] | null => {
  // More aggressive hyphenation for narrow widths
  // Narrow (< 50): fill even with 2 chars
  // Wide (>= 50): need at least 3 chars to be worth it
  const minFragment = width < NARROW_WRAP_WIDTH ? 2 : 3;
  if (remainingSpace < minFragment) {
    return null;
  }

  const breakAt = findBestBreakPoint(word, remainingSpace);
  if (breakAt <= 0) {
    return null;
  }

  return [`${stripSoftHyphens(word.slice(0, breakAt))}-`, word.slice(breakAt + 1)];
};

const breakWord = (word: string, width: number): string => {
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
};

const wrapText = (text: string, width: number, options?: WrapOptions): string => {
  const shouldHyphenate = options?.hyphenation ?? false;

  const wrapSingleLine = (line: string): string => {
    // Hyphenate only non-ANSI text to protect inline code from being split
    const processedLine = shouldHyphenate ? hyphenatePreservingAnsi(line) : line;

    // Use ANSI-aware split to keep styled content (like inline code) atomic
    const words = splitPreservingAnsi(processedLine);
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
        // Reserve one column for the space before the wrapped word fragment
        const remainingSpace = width - visibleLength(currentLine) - 1;
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
        currentLine = brokenLines.at(-1) ?? '';
      }
    }

    if (currentLine) {
      // Strip any remaining soft hyphens from the last line
      lines.push(stripSoftHyphens(currentLine));
    }

    return lines.join('\n');
  };

  // Preserve explicit line breaks (e.g. Markdown <br> / hard breaks)
  return text
    .split('\n')
    .map((line) => wrapSingleLine(line))
    .join('\n');
};

const renderText = (text: string, config: TextConfig): string => {
  const wrapped = wrapText(text, config.width, {
    hyphenation: config.hyphenation,
    locale: config.locale ?? 'en-us',
  });
  const textColor = getTextColor();
  return `${textColor(wrapped)}\n`;
};

export { renderText, wrapText };
