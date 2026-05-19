// Src/lib/elements/code.ts
import boxen from 'boxen';
import { Effect } from 'effect';

import { theme } from '../../ui/themes';
import {
  getBoxTitleStyle,
  getHexColors,
  getInlineCodeStyle,
  getMutedColor,
  getSubtleColor,
} from '../../ui/themes/semantic';
import { visibleLength } from '../ansi';
import { getLanguageLabel, normalizeLang, supportsNerdFonts } from '../languages';
import { highlightCode } from '../shiki';

export interface CodeConfig {
  width: number;
  wrap: boolean;
  continuation: string;
  theme: string;
  useNerdFonts?: boolean;
}

/** Skip Shiki for very long blocks (bat / claudewatch pattern). */
export const MAX_CODE_BLOCK_HIGHLIGHT_LENGTH = 16 * 1024;

// ESC character for ANSI escape sequence parsing (avoid literal \x1b for linter)
const ESC = String.fromCodePoint(0x1B);
const ANSI_RESET = `${ESC}[0m`;
const ANSI_SGR_PATTERN = new RegExp(`${ESC}\\[([0-9;]*)m`);

/**
 * Track active ANSI styles. Handles basic SGR codes:
 * 0 = reset, 1 = bold, 2 = dim, 3 = italic, 4 = underline,
 * 30-37/90-97 = fg color, 38;5;N = 256 fg, 38;2;R;G;B = RGB fg,
 * 40-47/100-107 = bg color, 48;5;N = 256 bg, 48;2;R;G;B = RGB bg
 */
class AnsiState {
  private styles = new Set<string>();
  private fgColor: string | null = null;
  private bgColor: string | null = null;

  apply(sequence: string): void {
    const match = sequence.match(ANSI_SGR_PATTERN);
    const params = match?.[1]?.split(';').filter(Boolean) ?? [];
    let i = 0;

    while (i < params.length) {
      const param = params[i];
      if (!param) {break;}
      const code = Number.parseInt(param, 10);

      if (code === 0) {
        // Reset all
        this.styles.clear();
        this.fgColor = null;
        this.bgColor = null;
      } else if (code >= 1 && code <= 9) {
        // Style attributes (bold, dim, italic, underline, etc.)
        this.styles.add(param);
      } else if (code >= 21 && code <= 29) {
        // Turn off style attributes
        this.styles.delete(String(code - 20));
      } else if (code === 38 && params[i + 1] === '5') {
        // 256 foreground color
        this.fgColor = `38;5;${params[i + 2]}`;
        i += 2;
      } else if (code === 38 && params[i + 1] === '2') {
        // RGB foreground color
        this.fgColor = `38;2;${params[i + 2]};${params[i + 3]};${params[i + 4]}`;
        i += 4;
      } else if (code === 48 && params[i + 1] === '5') {
        // 256 background color
        this.bgColor = `48;5;${params[i + 2]}`;
        i += 2;
      } else if (code === 48 && params[i + 1] === '2') {
        // RGB background color
        this.bgColor = `48;2;${params[i + 2]};${params[i + 3]};${params[i + 4]}`;
        i += 4;
      } else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
        // Basic foreground colors
        this.fgColor = param;
      } else if (code === 39) {
        // Default foreground
        this.fgColor = null;
      } else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
        // Basic background colors
        this.bgColor = param;
      } else if (code === 49) {
        // Default background
        this.bgColor = null;
      }

      i++;
    }
  }

  toSequence(): string {
    const parts = [...this.styles];
    if (this.fgColor) {parts.push(this.fgColor);}
    if (this.bgColor) {parts.push(this.bgColor);}
    return parts.length === 0 ? '' : `${ESC}[${parts.join(';')}m`;
  }

  clone(): AnsiState {
    const copy = new AnsiState();
    copy.styles = new Set(this.styles);
    copy.fgColor = this.fgColor;
    copy.bgColor = this.bgColor;
    return copy;
  }

  isEmpty(): boolean {
    return this.styles.size === 0 && this.fgColor === null && this.bgColor === null;
  }
}

/**
 * Slice a string by visible character positions, preserving ANSI codes.
 * Returns [sliced portion with reset, remainder with state prefix]
 */
function sliceByVisible(str: string, start: number, end?: number): [string, string] {
  let visiblePos = 0;
  let startIdx = 0;
  let endIdx = str.length;
  let foundStart = start === 0;
  let foundEnd = end === undefined;

  const state = new AnsiState();
  let stateAtEnd: AnsiState | null = null;

  const ansiRegex = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');

  let i = 0;
  while (i < str.length) {
    // Check for ANSI escape sequence at current position
    ansiRegex.lastIndex = i;
    const match = ansiRegex.exec(str);

    if (match?.index === i) {
      // Found ANSI sequence at current position - update state
      state.apply(match[0]);
      i += match[0].length;
      continue;
    }

    // This is a visible character
    if (!foundStart && visiblePos === start) {
      startIdx = i;
      foundStart = true;
    }

    visiblePos++;

    if (!foundEnd && end !== undefined && visiblePos === end) {
      endIdx = i + 1;
      stateAtEnd = state.clone();
      foundEnd = true;
      break;
    }

    i++;
  }

  // If we didn't find start, it means start is beyond string length
  if (!foundStart) {
    return ['', ''];
  }

  const sliced = str.slice(startIdx, endIdx);
  const remainder = str.slice(endIdx);

  // Add reset to end of sliced portion if we had active state
  const slicedWithReset = stateAtEnd && !stateAtEnd.isEmpty() ? sliced + ANSI_RESET : sliced;

  // Prepend state to remainder if there was active state
  const remainderWithState =
    stateAtEnd && !stateAtEnd.isEmpty() && remainder
      ? stateAtEnd.toSequence() + remainder
      : remainder;

  return [slicedWithReset, remainderWithState];
}

export function wrapCodeLines(code: string, width: number, continuation: string): string {
  const lines = code.split('\n');
  const wrapped: string[] = [];
  const continuationPrefix = `${getSubtleColor()(continuation)} `;
  const continuationWidth = continuation.length + 1;

  for (const line of lines) {
    if (visibleLength(line) <= width) {
      wrapped.push(line);
      continue;
    }

    // First chunk uses full width
    const [firstChunk, firstRest] = sliceByVisible(line, 0, width);
    wrapped.push(firstChunk);

    // Subsequent chunks reserve space for continuation prefix (+ 1 extra space)
    let remaining = firstRest;
    const chunkWidth = width - continuationWidth - 1;

    while (visibleLength(remaining) > 0) {
      const [chunk, rest] = sliceByVisible(remaining, 0, chunkWidth);
      wrapped.push(`${continuationPrefix} ${chunk}`);
      remaining = rest;
    }
  }

  return wrapped.join('\n');
}

export function renderInlineCode(code: string): string {
  return getInlineCodeStyle()(` ${code} `);
}

/** Box + wrap already-highlighted source (no Shiki). */
export const formatCodeBlockBox = (
  highlighted: string,
  lang: string,
  config: CodeConfig,
): string => {
  const useNerdFonts = config.useNerdFonts ?? supportsNerdFonts();
  const wrapped = config.wrap
    ? wrapCodeLines(highlighted, config.width - 4, config.continuation)
    : highlighted;

  const title = lang ? getLanguageLabel(lang, useNerdFonts) : undefined;

  const box = boxen(wrapped, {
    borderColor: getHexColors().subtle,
    borderStyle: 'round',
    padding: { bottom: 0, left: 1, right: 1, top: 0 },
    ...(title !== undefined ? { title: getBoxTitleStyle()(title) } : {}),
    titleAlignment: 'left',
    width: config.width,
  });

  return `${box}\n`;
};

export const highlightCodeBlockSource = Effect.fn('md.highlight-code-block')(
  (code: string, lang: string, themeId: string) =>
    Effect.gen(function* highlightCodeBlockSourceGen() {
      if (code.length > MAX_CODE_BLOCK_HIGHLIGHT_LENGTH) {
        return getMutedColor()(code);
      }
      const langId = normalizeLang(lang);
      const highlighted = yield* highlightCode(code, langId, themeId);
      if (!highlighted.includes('\u001B[')) {
        return getMutedColor()(code);
      }
      return highlighted;
    }),
);

export async function renderCodeBlock(
  code: string,
  lang: string,
  config: CodeConfig,
): Promise<string> {
  const highlighted = await Effect.runPromise(
    highlightCodeBlockSource(code, lang, theme().shikiTheme),
  );
  return formatCodeBlockBox(highlighted, lang, config);
}
