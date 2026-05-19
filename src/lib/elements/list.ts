// Src/lib/elements/list.ts
import { getAccentColor, getMutedColor } from '../../ui/themes/semantic';
import { visibleLength } from '../ansi';
import { wrapText } from './text';

const INDENT_SIZE = 3;
const BULLETS = ['•', '◦', '▪'] as const;

const CHECKBOXES = {
  checked: { nerd: '󰱒', unicode: '☑' },
  unchecked: { nerd: '󰄱', unicode: '☐' },
} as const;

interface ListItemConfig {
  width?: number;
  hyphenation?: boolean;
  task?: boolean;
  checked?: boolean;
  nerdFonts?: boolean;
}

const getBullet = (
  config: ListItemConfig | undefined,
  ordered: boolean,
  depth: number,
  index: number | undefined,
): string => {
  if (config?.task === true) {
    const style = config.checked === true ? CHECKBOXES.checked : CHECKBOXES.unchecked;
    return config.nerdFonts === true ? style.nerd : style.unicode;
  }
  if (ordered) {
    return `${index ?? 1}.`;
  }
  const bulletIndex = depth % BULLETS.length;
  return BULLETS[bulletIndex] ?? BULLETS[0];
};

const renderListItem = (
  text: string,
  ordered: boolean,
  depth: number,
  index?: number,
  config?: ListItemConfig,
): string => {
  const indent = ' '.repeat(depth * INDENT_SIZE);
  const bullet = getBullet(config, ordered, depth, index);
  const coloredBullet = getAccentColor()(bullet);
  const styledText =
    config?.task === true && config.checked === true ? getMutedColor()(text) : text;

  if (config?.width === undefined || config.width === 0) {
    return `${indent}${coloredBullet} ${styledText}`;
  }

  const bulletWidth = visibleLength(coloredBullet);
  const prefixWidth = indent.length + bulletWidth + 1;
  const textWidth = config.width - prefixWidth;

  if (textWidth <= 0) {
    return `${indent}${coloredBullet} ${styledText}`;
  }

  const wrapped = wrapText(styledText, textWidth, {
    hyphenation: config.hyphenation ?? false,
    locale: 'en-us',
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
};

const renderList = (
  items: string[],
  ordered: boolean,
  depth = 0,
  config?: ListItemConfig,
): string => items.map((item, i) => renderListItem(item, ordered, depth, i + 1, config)).join('\n');

export { renderList, renderListItem };
