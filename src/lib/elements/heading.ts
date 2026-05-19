import boxen from 'boxen';

import { getHeadingColor, getHexColors, getSubtleColor } from '../../ui/themes/semantic';

const FALLBACK_HEADING_LEVEL = 5;
const H1_BOX_PADDING = 8;
const H2_RULE_GAP = 2;

export const renderHeading = (text: string, level: number, width: number): string => {
  const cleanText = text.trim();

  switch (level) {
    case 1: {
      const boxed = boxen(getHeadingColor(1)(cleanText), {
        borderColor: getHexColors().h1,
        borderStyle: 'round',
        padding: { bottom: 0, left: 2, right: 2, top: 0 },
        textAlignment: 'center',
        width: Math.min(width, cleanText.length + H1_BOX_PADDING),
      });
      return `\n\n${boxed}\n\n`;
    }
    case 2: {
      const line = getSubtleColor()(
        '─'.repeat(Math.max(0, width - cleanText.length - H2_RULE_GAP)),
      );
      return `\n${getHeadingColor(2)(cleanText)} ${line}\n`;
    }
    case 3: {
      return `\n${getHeadingColor(3)(cleanText)}\n`;
    }
    case 4: {
      return `\n${getHeadingColor(4)(cleanText)}\n`;
    }
    default: {
      return `\n${getHeadingColor(FALLBACK_HEADING_LEVEL)(cleanText)}\n`;
    }
  }
};
