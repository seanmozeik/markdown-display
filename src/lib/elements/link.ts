// src/lib/elements/link.ts
import { getLinkColor, getSubtleColor } from '../../ui/themes/semantic';

interface LinkConfig {
  osc8: 'auto' | boolean;
  show_urls: boolean;
}

const OSC8_TERMINALS = ['iTerm.app', 'WezTerm', 'vscode', 'Hyper', 'kitty', 'Alacritty'];

export function supportsOsc8(): boolean {
  const term = Bun.env.TERM_PROGRAM ?? '';
  return OSC8_TERMINALS.some((t) => term.includes(t));
}

export function renderLink(text: string, url: string, config: LinkConfig): string {
  const useOsc8 = config.osc8 === true || (config.osc8 === 'auto' && supportsOsc8());
  const linkColor = getLinkColor();
  const styledText = linkColor(text);

  if (useOsc8) {
    const hyperlink = `\x1b]8;;${url}\x07${styledText}\x1b]8;;\x07`;
    if (config.show_urls && text !== url) {
      return `${hyperlink} ${getSubtleColor()(`(${url})`)}`;
    }
    return hyperlink;
  }

  if (text === url) {
    return styledText;
  }
  return `${styledText} ${getSubtleColor()(`(${url})`)}`;
}
