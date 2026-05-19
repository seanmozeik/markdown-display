// Src/lib/elements/blockquote.ts
import { getMutedColor, getSubtleColor } from '../../ui/themes/semantic';
import { wrapText } from './text';

interface BlockquoteConfig {
  width: number;
  hyphenation?: boolean;
}

export function renderBlockquote(text: string, config?: BlockquoteConfig, depth = 1): string {
  const prefixRaw = '│ '.repeat(depth);
  const prefix = getSubtleColor()(prefixRaw);
  const prefixWidth = prefixRaw.length;
  const innerWidth = config?.width ? config.width - prefixWidth : 0;

  // If width provided, re-wrap content to fit within blockquote
  const content =
    innerWidth > 0
      ? wrapText(text.replaceAll(/\n(?!\n)/g, ' ').replaceAll(/ +/g, ' '), innerWidth, {
          hyphenation: config?.hyphenation ?? true,
          locale: 'en-us',
        })
      : text;

  const mutedColor = getMutedColor();
  return content
    .split('\n')
    .map((line) => `${prefix}${mutedColor(line)}`)
    .join('\n');
}
