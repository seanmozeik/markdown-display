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

interface CodeConfig {
  width: number;
  wrap: boolean;
  continuation: string;
  theme: string;
  useNerdFonts?: boolean;
}

const KIBIBYTE = 1024;
const CODE_BLOCK_HIGHLIGHT_KIB = 16;

/** Skip Shiki for very long blocks (bat / claudewatch pattern). */
const MAX_CODE_BLOCK_HIGHLIGHT_LENGTH = CODE_BLOCK_HIGHLIGHT_KIB * KIBIBYTE;

const ESC = '\u001B';
const ANSI_RESET = `${ESC}[0m`;
const ANSI_SGR_PATTERN = new RegExp(`${ESC}\\[([0-9;]*)m`, 'u');
const ANSI_SEQUENCE_PATTERN = new RegExp(`${ESC}\\[[0-9;]*m`, 'gu');

const SGR_RESET = 0;
const SGR_STYLE_MIN = 1;
const SGR_STYLE_MAX = 9;
const SGR_STYLE_OFF_BASE = 20;
const SGR_FG_EXTENDED = 38;
const SGR_BG_EXTENDED = 48;
const SGR_FG_DEFAULT = 39;
const SGR_BG_DEFAULT = 49;
const SGR_FG_BASIC_MIN = 30;
const SGR_FG_BASIC_MAX = 37;
const SGR_FG_BRIGHT_MIN = 90;
const SGR_FG_BRIGHT_MAX = 97;
const SGR_BG_BASIC_MIN = 40;
const SGR_BG_BASIC_MAX = 47;
const SGR_BG_BRIGHT_MIN = 100;
const SGR_BG_BRIGHT_MAX = 107;
const SGR_MODE_256 = '5';
const SGR_MODE_RGB = '2';
const RGB_PARAM_COUNT = 4;
const BOX_HORIZONTAL_PADDING = 4;

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

  private resetAll(): void {
    this.styles.clear();
    this.fgColor = null;
    this.bgColor = null;
  }

  private applyStyleOn(code: number, param: string): void {
    if (code >= SGR_STYLE_MIN && code <= SGR_STYLE_MAX) {
      this.styles.add(param);
    }
  }

  private applyStyleOff(code: number): void {
    if (code >= SGR_STYLE_OFF_BASE + 1 && code <= SGR_STYLE_OFF_BASE + SGR_STYLE_MAX) {
      this.styles.delete(String(code - SGR_STYLE_OFF_BASE));
    }
  }

  private applyExtendedColor(
    params: string[],
    index: number,
    baseCode: number,
    target: 'fg' | 'bg',
  ): number {
    if (params[index + 1] === SGR_MODE_256) {
      const sequence = `${baseCode};5;${params[index + 2]}`;
      if (target === 'fg') {
        this.fgColor = sequence;
      } else {
        this.bgColor = sequence;
      }
      return 2;
    }
    if (params[index + 1] === SGR_MODE_RGB) {
      const sequence = `${baseCode};2;${params[index + 2]};${params[index + 3]};${params[index + 4]}`;
      if (target === 'fg') {
        this.fgColor = sequence;
      } else {
        this.bgColor = sequence;
      }
      return RGB_PARAM_COUNT;
    }
    return 0;
  }

  private applyBasicFg(code: number, param: string): void {
    if (
      (code >= SGR_FG_BASIC_MIN && code <= SGR_FG_BASIC_MAX) ||
      (code >= SGR_FG_BRIGHT_MIN && code <= SGR_FG_BRIGHT_MAX)
    ) {
      this.fgColor = param;
    }
  }

  private applyBasicBg(code: number, param: string): void {
    if (
      (code >= SGR_BG_BASIC_MIN && code <= SGR_BG_BASIC_MAX) ||
      (code >= SGR_BG_BRIGHT_MIN && code <= SGR_BG_BRIGHT_MAX)
    ) {
      this.bgColor = param;
    }
  }

  apply(sequence: string): void {
    const match = sequence.match(ANSI_SGR_PATTERN);
    const params = match?.[1]?.split(';').filter(Boolean) ?? [];
    let i = 0;

    while (i < params.length) {
      const param = params[i];
      if (param === undefined || param.length === 0) {
        break;
      }
      const code = Number.parseInt(param, 10);

      if (code === SGR_RESET) {
        this.resetAll();
      } else {
        this.applyStyleOn(code, param);
        this.applyStyleOff(code);
        i += this.applyExtendedColor(params, i, SGR_FG_EXTENDED, 'fg');
        i += this.applyExtendedColor(params, i, SGR_BG_EXTENDED, 'bg');
        this.applyBasicFg(code, param);
        if (code === SGR_FG_DEFAULT) {
          this.fgColor = null;
        }
        this.applyBasicBg(code, param);
        if (code === SGR_BG_DEFAULT) {
          this.bgColor = null;
        }
      }

      i += 1;
    }
  }

  toSequence(): string {
    const parts = [...this.styles];
    if (this.fgColor !== null) {
      parts.push(this.fgColor);
    }
    if (this.bgColor !== null) {
      parts.push(this.bgColor);
    }
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
const sliceByVisible = (str: string, start: number, end?: number): [string, string] => {
  let visiblePos = 0;
  let startIdx = 0;
  let endIdx = str.length;
  let foundStart = start === 0;
  const state = new AnsiState();
  let stateAtEnd: AnsiState | null = null;

  let i = 0;
  while (i < str.length) {
    ANSI_SEQUENCE_PATTERN.lastIndex = i;
    const match = ANSI_SEQUENCE_PATTERN.exec(str);

    if (match?.index === i) {
      state.apply(match[0]);
      i += match[0].length;
    } else {
      if (!foundStart && visiblePos === start) {
        startIdx = i;
        foundStart = true;
      }

      visiblePos += 1;

      if (end !== undefined && visiblePos === end) {
        endIdx = i + 1;
        stateAtEnd = state.clone();
        break;
      }

      i += 1;
    }
  }

  if (!foundStart) {
    return ['', ''];
  }

  const sliced = str.slice(startIdx, endIdx);
  const remainder = str.slice(endIdx);

  const slicedWithReset =
    stateAtEnd !== null && !stateAtEnd.isEmpty() ? sliced + ANSI_RESET : sliced;

  const remainderWithState =
    stateAtEnd !== null && !stateAtEnd.isEmpty() && remainder.length > 0
      ? stateAtEnd.toSequence() + remainder
      : remainder;

  return [slicedWithReset, remainderWithState];
};

const wrapCodeLines = (code: string, width: number, continuation: string): string => {
  const lines = code.split('\n');
  const wrapped: string[] = [];
  const continuationPrefix = `${getSubtleColor()(continuation)} `;
  const continuationWidth = continuation.length + 1;

  for (const line of lines) {
    if (visibleLength(line) <= width) {
      wrapped.push(line);
    } else {
      const [firstChunk, firstRest] = sliceByVisible(line, 0, width);
      wrapped.push(firstChunk);

      let remaining = firstRest;
      const chunkWidth = width - continuationWidth - 1;

      while (visibleLength(remaining) > 0) {
        const [chunk, rest] = sliceByVisible(remaining, 0, chunkWidth);
        wrapped.push(`${continuationPrefix} ${chunk}`);
        remaining = rest;
      }
    }
  }

  return wrapped.join('\n');
};

const renderInlineCode = (code: string): string => getInlineCodeStyle()(` ${code} `);

/** Box + wrap already-highlighted source (no Shiki). */
const formatCodeBlockBox = (highlighted: string, lang: string, config: CodeConfig): string => {
  const useNerdFonts = config.useNerdFonts ?? supportsNerdFonts();
  const wrapped = config.wrap
    ? wrapCodeLines(highlighted, config.width - BOX_HORIZONTAL_PADDING, config.continuation)
    : highlighted;

  const title = lang.length > 0 ? getLanguageLabel(lang, useNerdFonts) : undefined;

  const box = boxen(wrapped, {
    borderColor: getHexColors().subtle,
    borderStyle: 'round',
    padding: { bottom: 0, left: 1, right: 1, top: 0 },
    ...(title === undefined ? {} : { title: getBoxTitleStyle()(title) }),
    titleAlignment: 'left',
    width: config.width,
  });

  return `${box}\n`;
};

const highlightCodeBlockSource = Effect.fn('md.highlight-code-block')(
  (code: string, lang: string, themeId: string) =>
    Effect.gen(function* highlightCodeBlockSourceGen() {
      if (code.length > MAX_CODE_BLOCK_HIGHLIGHT_LENGTH) {
        return getMutedColor()(code);
      }
      const langId = normalizeLang(lang);
      const highlighted = yield* highlightCode(code, langId, themeId);
      if (highlighted.includes('\u001B[')) {
        return highlighted;
      }
      return getMutedColor()(code);
    }),
);

const renderCodeBlock = Effect.fn('md.render-code-block')(function* renderCodeBlockGen(
  code: string,
  lang: string,
  config: CodeConfig,
) {
  const highlighted = yield* highlightCodeBlockSource(code, lang, theme().shikiTheme);
  return formatCodeBlockBox(highlighted, lang, config);
});

export {
  type CodeConfig,
  formatCodeBlockBox,
  highlightCodeBlockSource,
  MAX_CODE_BLOCK_HIGHLIGHT_LENGTH,
  renderCodeBlock,
  renderInlineCode,
  wrapCodeLines,
};
