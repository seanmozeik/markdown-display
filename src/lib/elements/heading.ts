import boxen from 'boxen';
import { frappe } from '../../ui/theme';

export function renderHeading(text: string, level: number, width: number): string {
  const cleanText = text.trim();

  switch (level) {
    case 1: {
      // H1 gets a prominent boxen container
      const boxed = boxen(frappe.text(cleanText), {
        borderColor: '#ca9ee6', // frappe.mauve
        borderStyle: 'round',
        padding: { bottom: 0, left: 2, right: 2, top: 0 },
        textAlignment: 'center',
        width: Math.min(width, cleanText.length + 8)
      });
      return `\n\n${boxed}\n\n`;
    }
    case 2: {
      const lineLength = Math.max(0, width - cleanText.length - 2);
      const line = frappe.surface2('─'.repeat(lineLength));
      return `\n${frappe.lavender(cleanText)} ${line}\n`;
    }
    default: {
      const color = level === 3 ? frappe.blue : level === 4 ? frappe.teal : frappe.subtext1;
      return `\n${color(cleanText)}\n`;
    }
  }
}
