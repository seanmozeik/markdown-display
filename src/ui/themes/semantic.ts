// Src/ui/themes/semantic.ts

import { ansiBold, ansiFg, ansiFgBg, ansiFgTransition, ansiItalic } from './ansi';
import { theme } from './index';

type StyleFn = (text: string) => string;

interface HexColors {
  accent: string;
  h1: string;
  subtle: string;
}

interface GradientColors {
  banner: string[];
  error: string[];
  success: string[];
}

/** Get bold text style (uses override or emphasis color) */
export const getBoldStyle = (): StyleFn => {
  const t = theme();
  const color = t.overrides?.bold ?? t.colors.emphasis;
  return ansiBold(color);
};

/** Get italic text style (uses override or auxiliary color) */
export const getItalicStyle = (): StyleFn => {
  const t = theme();
  const color = t.overrides?.italic ?? t.colors.auxiliary;
  return ansiItalic(color);
};

/** Get inline code style (fg + bg) */
export const getInlineCodeStyle = (): StyleFn => {
  const t = theme();
  if (t.overrides?.inlineCode) {
    return ansiFgBg(t.overrides.inlineCode.fg, t.overrides.inlineCode.bg);
  }
  return ansiFgBg(t.colors.accent, t.colors.surface);
};

/** Get heading color by level (1-5) */
export const getHeadingColor = (level: number): StyleFn => {
  const t = theme();
  const o = t.overrides;
  const heading = o?.heading;

  switch (level) {
    case 1: {
      return ansiFg(o?.h1 ?? heading ?? t.colors.accent);
    }
    case 2: {
      return ansiFg(o?.h2 ?? heading ?? t.colors.accent);
    }
    case 3: {
      return ansiFg(o?.h3 ?? heading ?? t.colors.info);
    }
    case 4: {
      return ansiFg(o?.h4 ?? heading ?? t.colors.auxiliary);
    }
    default: {
      return ansiFg(t.colors.muted);
    }
  }
};

/** Get link color */
export const getLinkColor = (): StyleFn => {
  const t = theme();
  return ansiFg(t.overrides?.link ?? t.colors.accent);
};

/** Get body text color */
export const getTextColor = (): StyleFn => ansiFg(theme().colors.text);

/** Get muted/secondary text color */
export const getMutedColor = (): StyleFn => ansiFg(theme().colors.muted);

/** Get subtle/border color */
export const getSubtleColor = (): StyleFn => ansiFg(theme().colors.subtle);

/** Get error color */
export const getErrorColor = (): StyleFn => ansiFg(theme().colors.error);

/** Get success color */
export const getSuccessColor = (): StyleFn => ansiFg(theme().colors.success);

/** Get accent color (headings, links, list markers) */
export const getAccentColor = (): StyleFn => ansiFg(theme().colors.accent);

/** Get hex color values for libraries that need hex (boxen, gradient-string) */
export const getHexColors = (): HexColors => {
  const t = theme();
  return {
    accent: t.colors.accent,
    h1: t.overrides?.h1 ?? t.overrides?.heading ?? t.colors.accent,
    subtle: t.colors.subtle,
  };
};

/** Style box title that transitions back to border color instead of resetting */
export const getBoxTitleStyle = (): StyleFn => {
  const t = theme();
  const titleColor = t.overrides?.link ?? t.colors.accent;
  const borderColor = t.colors.subtle;
  return ansiFgTransition(titleColor, borderColor);
};

/** Get gradient color arrays for gradient-string library */
export const getGradientColors = (): GradientColors => {
  const t = theme();
  const o = t.overrides;

  const banner = [
    o?.h1 ?? o?.heading ?? t.colors.accent,
    o?.bold ?? o?.h2 ?? t.colors.emphasis,
    o?.h2 ?? t.colors.info,
  ];

  const success = [t.colors.success, t.colors.info];
  const error = [t.colors.error, t.colors.warning];

  return { banner, error, success };
};
