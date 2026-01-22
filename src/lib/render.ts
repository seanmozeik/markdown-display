// src/lib/render.ts

import type { Config } from './config';
import { parseMarkdown } from './parser';
import { getTerminalWidth } from './width';

export async function render(markdown: string, config: Config): Promise<string> {
  if (!markdown.trim()) return '';

  const width =
    config.width === 'auto' ? getTerminalWidth() : getTerminalWidth(config.width as number);

  return parseMarkdown(markdown, {
    codeTheme: config.code.theme,
    hyphenation: config.text.hyphenation,
    osc8: config.links.osc8,
    width,
    wrap: config.code.wrap
  });
}
