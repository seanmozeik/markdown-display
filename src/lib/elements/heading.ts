import boxen from 'boxen';
import { getHeadingColor, getHexColors, getSubtleColor } from '../../ui/themes/semantic';

export function renderHeading(text: string, level: number, width: number): string {
  const cleanText = text.trim();
  const colors = getHexColors();

  switch (level) {
    case 1: {
      const h1Color = getHeadingColor(1);
      const boxed = boxen(h1Color(cleanText), {
        borderColor: colors.h1,
        borderStyle: 'round',
        padding: { bottom: 0, left: 2, right: 2, top: 0 },
        textAlignment: 'center',
        width: Math.min(width, cleanText.length + 8)
      });
      return `\n\n${boxed}\n\n`;
    }
    case 2: {
      const lineLength = Math.max(0, width - cleanText.length - 2);
      const line = getSubtleColor()('─'.repeat(lineLength));
      return `\n${getHeadingColor(2)(cleanText)} ${line}\n`;
    }
    case 3:
      return `\n${getHeadingColor(3)(cleanText)}\n`;
    case 4:
      return `\n${getHeadingColor(4)(cleanText)}\n`;
    default:
      return `\n${getHeadingColor(5)(cleanText)}\n`;
  }
}
