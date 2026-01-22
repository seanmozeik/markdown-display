// src/lib/elements/link.ts
import { frappe } from '../../ui/theme';

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
  const textAndUrlSame = text === url;

  if (useOsc8) {
    const hyperlink = `\x1b]8;;${url}\x07${frappe.blue(text)}\x1b]8;;\x07`;
    if (config.show_urls && !textAndUrlSame) {
      return `${hyperlink} ${frappe.surface2(`(${url})`)}`;
    }
    return hyperlink;
  }

  if (textAndUrlSame) {
    return frappe.blue(url);
  }
  return `${frappe.blue(text)} ${frappe.surface2(`(${url})`)}`;
}
