// Src/lib/render.ts

import { Effect } from 'effect';

import type { Config } from './config';
import { resolveNerdFonts } from './languages';
import { applyPadding, calculateLayout } from './layout';
import { parseMarkdown } from './parser';
import { getRawTerminalWidth, getTerminalWidth } from './width';

export const render = Effect.fn('md.render')(function* renderGen(markdown: string, config: Config) {
  if (!markdown.trim()) {
    return '';
  }

  const contentWidth =
    config.width === 'auto' ? getTerminalWidth() : getTerminalWidth(config.width);

  // Use raw terminal width for centering (not capped), but capped width for content
  const rawTerminalWidth = getRawTerminalWidth();

  const layout = calculateLayout(rawTerminalWidth, contentWidth, {
    maxWidth: config.display.maxWidth,
    padding: config.display.padding,
  });

  const content = yield* parseMarkdown(markdown, {
    continuation: config.code.continuation,
    hyphenation: config.text.hyphenation,
    nerdFonts: resolveNerdFonts(config.nerd_fonts),
    osc8: config.links.osc8,
    width: layout.contentWidth,
    wrap: config.code.wrap,
  });

  return applyPadding(content, layout.sidePadding);
});
