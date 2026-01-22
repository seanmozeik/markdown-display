// src/lib/elements/blockquote.ts
import { frappe } from '../../ui/theme';

export function renderBlockquote(text: string, depth = 1): string {
  const prefix = frappe.surface2('│ '.repeat(depth));
  const lines = text.split('\n');

  return lines.map((line) => `${prefix}${frappe.overlay1(line)}`).join('\n');
}
