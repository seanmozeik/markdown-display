// src/lib/elements/list.ts
import { getAccentColor, getMutedColor } from '../../ui/themes/semantic';
import { visibleLength } from '../ansi';
import { wrapText } from './text';

const INDENT_SIZE = 3;
const BULLETS = ['•', '◦', '▪'] as const;

const CHECKBOXES = {
  checked: { nerd: '󰱒', unicode: '☑' },
  unchecked: { nerd: '󰄱', unicode: '☐' }
} as const;

interface ListItemConfig {
  width?: number;
  hyphenation?: boolean;
  task?: boolean;
  checked?: boolean;
  nerdFonts?: boolean;
}

export function renderListItem(
  text: string,
  ordered: boolean,
  depth: number,
  index?: number,
  config?: ListItemConfig
): string {
  const indent = ' '.repeat(depth * INDENT_SIZE);
  let bullet: string;
  if (config?.task) {
    const style = config.checked ? CHECKBOXES.checked : CHECKBOXES.unchecked;
    bullet = config.nerdFonts ? style.nerd : style.unicode;
  } else if (ordered) {
    bullet = `${index ?? 1}.`;
  } else {
    bullet = BULLETS[depth % BULLETS.length] ?? '•';
  }
  const accentColor = getAccentColor();
  const coloredBullet = accentColor(bullet);
  const displayText = config?.task && config.checked ? getMutedColor()(text) : text;

  // If no width specified, return without wrapping
  if (!config?.width) {
    return `${indent}${coloredBullet} ${displayText}`;
  }

  // Calculate available width for text (subtract indent + bullet + space)
  const bulletWidth = visibleLength(coloredBullet);
  const prefixWidth = indent.length + bulletWidth + 1; // +1 for space after bullet
  const textWidth = config.width - prefixWidth;

  if (textWidth <= 0) {
    return `${indent}${coloredBullet} ${displayText}`;
  }

  // Wrap the text (apply muting before wrapping so each line is muted)
  const textToWrap = config?.task && config.checked ? getMutedColor()(text) : text;
  const wrapped = wrapText(textToWrap, textWidth, {
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
