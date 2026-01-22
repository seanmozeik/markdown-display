// src/lib/elements/text.ts
import { frappe } from '../../ui/theme';

interface TextConfig {
  width: number;
  hyphenation: boolean;
  locale?: string;
}

export function wrapText(text: string, width: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= width) {
      currentLine = testLine;
    } else if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      lines.push(word.slice(0, width));
      currentLine = word.slice(width);
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

export function renderText(text: string, config: TextConfig): string {
  const wrapped = wrapText(text, config.width);
  return `${frappe.subtext1(wrapped)}\n`;
}
