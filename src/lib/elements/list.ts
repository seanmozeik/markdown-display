// src/lib/elements/list.ts
import { frappe } from '../../ui/theme';
import { visibleLength } from '../ansi';
import { wrapText } from './text';

const INDENT_SIZE = 3;
const BULLETS = ['•', '◦', '▪'] as const;

interface ListItemConfig {
  width?: number;
  hyphenation?: boolean;
}

export function renderListItem(
  text: string,
  ordered: boolean,
  depth: number,
  index?: number,
  config?: ListItemConfig
): string {
  const indent = ' '.repeat(depth * INDENT_SIZE);
  const bulletChar = BULLETS[depth % BULLETS.length] ?? '•';
  const bullet = ordered ? `${index ?? 1}.` : bulletChar;
  const coloredBullet = frappe.mauve(bullet);

  // If no width specified, return without wrapping
  if (!config?.width) {
    return `${indent}${coloredBullet} ${text}`;
  }

  // Calculate available width for text (subtract indent + bullet + space)
  const bulletWidth = visibleLength(coloredBullet);
  const prefixWidth = indent.length + bulletWidth + 1; // +1 for space after bullet
  const textWidth = config.width - prefixWidth;

  if (textWidth <= 0) {
    return `${indent}${coloredBullet} ${text}`;
  }

  // Wrap the text
  const wrapped = wrapText(text, textWidth, {
    hyphenation: config.hyphenation ?? false,
    locale: 'en-us'
  });

  const lines = wrapped.split('\n');
  const continuationIndent = ' '.repeat(prefixWidth);

  return lines
    .map((line, i) => {
      if (i === 0) {
        return `${indent}${coloredBullet} ${line}`;
      }
      return `${continuationIndent}${line}`;
    })
    .join('\n');
}

export function renderList(
  items: string[],
  ordered: boolean,
  depth = 0,
  config?: ListItemConfig
): string {
  return items.map((item, i) => renderListItem(item, ordered, depth, i + 1, config)).join('\n');
}
