// src/lib/elements/blockquote.ts
import { getMutedColor, getSubtleColor } from '../../ui/themes/semantic';
import { wrapText } from './text';

interface BlockquoteConfig {
  width: number;
  hyphenation?: boolean;
}

export function renderBlockquote(text: string, config?: BlockquoteConfig, depth = 1): string {
  const prefixRaw = '│ '.repeat(depth);
  const subtleColor = getSubtleColor();
  const prefix = subtleColor(prefixRaw);
  const prefixWidth = prefixRaw.length;

  // If width provided, re-wrap content to fit within blockquote
  let content = text;
  if (config?.width) {
    const innerWidth = config.width - prefixWidth;
    if (innerWidth > 0) {
      // Strip existing newlines from paragraphs (they were wrapped at wrong width)
      // and re-wrap at correct width
      const unwrapped = text.replace(/\n(?!\n)/g, ' ').replace(/ {2,}/g, ' ');
      content = wrapText(unwrapped, innerWidth, {
        hyphenation: config.hyphenation ?? true,
        locale: 'en-us'
      });
    }
  }

  const lines = content.split('\n');
  const mutedColor = getMutedColor();
  return lines.map((line) => `${prefix}${mutedColor(line)}`).join('\n');
}
