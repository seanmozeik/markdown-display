// src/lib/render.ts

import type { Config } from './config';
import { resolveNerdFonts } from './languages';
import { applyPadding, calculateLayout } from './layout';
import { parseMarkdown } from './parser';
import { getTerminalWidth } from './width';

export async function render(markdown: string, config: Config): Promise<string> {
  if (!markdown.trim()) return '';

  const terminalWidth =
    config.width === 'auto' ? getTerminalWidth() : getTerminalWidth(config.width as number);

  const layout = calculateLayout(terminalWidth, {
    maxWidth: config.display.maxWidth,
    padding: config.display.padding
  });

  const content = await parseMarkdown(markdown, {
    codeTheme: config.code.theme,
    hyphenation: config.text.hyphenation,
    nerdFonts: resolveNerdFonts(config.nerd_fonts),
    osc8: config.links.osc8,
    width: layout.contentWidth,
    wrap: config.code.wrap
  });

  return applyPadding(content, layout.sidePadding);
}
