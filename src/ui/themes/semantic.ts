// src/ui/themes/semantic.ts

import { ansiBg, ansiBold, ansiFg, ansiFgBg, ansiItalic } from './ansi';
import { theme } from './index';

type StyleFn = (text: string) => string;

/** Get bold text style (uses override or emphasis color) */
export function getBoldStyle(): StyleFn {
  const t = theme();
  const color = t.overrides?.bold ?? t.colors.emphasis;
  return ansiBold(color);
}

/** Get italic text style (uses override or auxiliary color) */
export function getItalicStyle(): StyleFn {
  const t = theme();
  const color = t.overrides?.italic ?? t.colors.auxiliary;
  return ansiItalic(color);
}

/** Get inline code style (fg + bg) */
export function getInlineCodeStyle(): StyleFn {
  const t = theme();
  if (t.overrides?.inlineCode) {
    return ansiFgBg(t.overrides.inlineCode.fg, t.overrides.inlineCode.bg);
  }
  return ansiFgBg(t.colors.accent, t.colors.surface);
}

/** Get heading color by level (1-5) */
export function getHeadingColor(level: number): StyleFn {
  const t = theme();
  const o = t.overrides;

  switch (level) {
    case 1:
      return ansiFg(o?.h1 ?? o?.heading ?? t.colors.accent);
    case 2:
      return ansiFg(o?.h2 ?? o?.heading ?? t.colors.accent);
    case 3:
      return ansiFg(o?.h3 ?? o?.heading ?? t.colors.info);
    case 4:
      return ansiFg(o?.h4 ?? o?.heading ?? t.colors.auxiliary);
    default:
      return ansiFg(t.colors.muted);
  }
}

/** Get link color */
export function getLinkColor(): StyleFn {
  const t = theme();
  return ansiFg(t.overrides?.link ?? t.colors.accent);
}

/** Get body text color */
export function getTextColor(): StyleFn {
  return ansiFg(theme().colors.text);
}

/** Get muted/secondary text color */
export function getMutedColor(): StyleFn {
  return ansiFg(theme().colors.muted);
}

/** Get subtle/border color */
export function getSubtleColor(): StyleFn {
  return ansiFg(theme().colors.subtle);
}

/** Get surface background color */
export function getSurfaceColor(): StyleFn {
  return ansiBg(theme().colors.surface);
}

/** Get error color */
export function getErrorColor(): StyleFn {
  return ansiFg(theme().colors.error);
}

/** Get warning color */
export function getWarningColor(): StyleFn {
  return ansiFg(theme().colors.warning);
}

/** Get success color */
export function getSuccessColor(): StyleFn {
  return ansiFg(theme().colors.success);
}

/** Get info color */
export function getInfoColor(): StyleFn {
  return ansiFg(theme().colors.info);
}

/** Get accent color (headings, links, list markers) */
export function getAccentColor(): StyleFn {
  return ansiFg(theme().colors.accent);
}

/** Get hex color values for libraries that need hex (boxen, gradient-string) */
export function getHexColors() {
  const t = theme();
  return {
    accent: t.colors.accent,
    bg: t.colors.bg,
    error: t.colors.error,
    h1: t.overrides?.h1 ?? t.overrides?.heading ?? t.colors.accent,
    h2: t.overrides?.h2 ?? t.overrides?.heading ?? t.colors.accent,
    info: t.colors.info,
    muted: t.colors.muted,
    subtle: t.colors.subtle,
    success: t.colors.success,
    surface: t.colors.surface,
    text: t.colors.text,
    warning: t.colors.warning
  };
}

/** Get gradient color arrays for gradient-string library */
export function getGradientColors() {
  const t = theme();
  const o = t.overrides;

  // Banner gradient: Use heading colors (h1 -> h2 -> bold or accent)
  // This creates a pleasing gradient from primary accent through heading colors
  const banner = [
    o?.h1 ?? o?.heading ?? t.colors.accent,
    o?.bold ?? o?.h2 ?? t.colors.emphasis,
    o?.h2 ?? t.colors.info
  ];

  // Status gradients
  const success = [t.colors.success, t.colors.info];
  const error = [t.colors.error, t.colors.warning];

  return { banner, error, success };
}
