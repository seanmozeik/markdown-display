// Src/lib/elements/blockquote.ts
import { getMutedColor, getSubtleColor } from '../../ui/themes/semantic';
import { wrapText } from './text';

interface BlockquoteConfig {
  width: number;
  hyphenation?: boolean;
}

const NEWLINE_NOT_DOUBLE = /\n(?!\n)/gu;
const COLLAPSE_SPACES = / +/gu;

export const renderBlockquote = (text: string, config?: BlockquoteConfig, depth = 1): string => {
  const prefixRaw = '│ '.repeat(depth);
  const prefix = getSubtleColor()(prefixRaw);
  const prefixWidth = prefixRaw.length;
  const innerWidth =
    config?.width !== undefined && config.width > 0 ? config.width - prefixWidth : 0;

  const content =
    innerWidth > 0
      ? wrapText(
          text.replaceAll(NEWLINE_NOT_DOUBLE, ' ').replaceAll(COLLAPSE_SPACES, ' '),
          innerWidth,
          { hyphenation: config?.hyphenation ?? true, locale: 'en-us' },
        )
      : text;

  const mutedColor = getMutedColor();
  return content
    .split('\n')
    .map((line) => `${prefix}${mutedColor(line)}`)
    .join('\n');
};
