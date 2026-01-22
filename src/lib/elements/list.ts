// src/lib/elements/list.ts
import { frappe } from '../../ui/theme';

const INDENT_SIZE = 3;
const BULLETS = ['•', '◦', '▪'] as const;

export function renderListItem(
  text: string,
  ordered: boolean,
  depth: number,
  index?: number
): string {
  const indent = ' '.repeat(depth * INDENT_SIZE);
  const bulletChar = BULLETS[depth % BULLETS.length] ?? '•';
  const bullet = ordered ? `${index ?? 1}.` : bulletChar;

  return `${indent}${frappe.mauve(bullet)} ${text}`;
}

export function renderList(items: string[], ordered: boolean, depth = 0): string {
  return items.map((item, i) => renderListItem(item, ordered, depth, i + 1)).join('\n');
}
