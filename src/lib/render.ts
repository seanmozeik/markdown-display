// src/lib/render.ts

import type { Config } from './config';
import { resolveNerdFonts } from './languages';
import { applyPadding, calculateLayout } from './layout';
import { parseMarkdown } from './parser';
import { getRawTerminalWidth, getTerminalWidth } from './width';

export async function render(markdown: string, config: Config): Promise<string> {
  if (!markdown.trim()) return '';

  const contentWidth =
    config.width === 'auto' ? getTerminalWidth() : getTerminalWidth(config.width as number);

  // Use raw terminal width for centering (not capped), but capped width for content
  const rawTerminalWidth = getRawTerminalWidth();

  const layout = calculateLayout(rawTerminalWidth, contentWidth, {
    maxWidth: config.display.maxWidth,
    padding: config.display.padding
  });

  const content = await parseMarkdown(markdown, {
    continuation: config.code.continuation,
    hyphenation: config.text.hyphenation,
    nerdFonts: resolveNerdFonts(config.nerd_fonts),
    osc8: config.links.osc8,
    width: layout.contentWidth,
    wrap: config.code.wrap
  });

  return applyPadding(content, layout.sidePadding);
}
