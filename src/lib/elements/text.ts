// src/lib/elements/text.ts
import { hyphenateSync } from 'hyphen/en';
import { frappe } from '../../ui/theme';
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
      // Strip soft hyphens from the completed line before pushing
      lines.push(currentLine.replace(/\u00AD/g, ''));
      // Try to fit word, potentially breaking at soft hyphens
      currentLine = breakWord(word, width);
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
  return `${frappe.subtext1(wrapped)}\n`;
}
