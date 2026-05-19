// Src/ui/themes/types.ts

/** Core color roles for markdown rendering */
export interface ThemeColors {
  /** Main background */
  bg: string;
  /** Elevated surfaces (code blocks, boxes) */
  surface: string;
  /** Body text */
  text: string;
  /** Secondary text, blockquotes */
  muted: string;
  /** Borders, decorations */
  subtle: string;
  /** Headings, links */
  accent: string;
  /** Bold text */
  emphasis: string;
  /** Italic text */
  auxiliary: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

/** Optional overrides for theme-specific character */
export interface ThemeOverrides {
  bold?: string;
  italic?: string;
  inlineCode?: { fg: string; bg: string };
  link?: string;
  heading?: string;
  h1?: string;
  h2?: string;
  h3?: string;
  h4?: string;
}

/** Complete theme definition */
export interface ThemePalette {
  /** Display name (e.g., "Catppuccin Frappe") */
  name: string;
  /** Theme ID (e.g., "catppuccin-frappe") */
  id: string;
  /** Shiki theme ID for code highlighting */
  shikiTheme: string;
  type: 'light' | 'dark';
  colors: ThemeColors;
  overrides?: ThemeOverrides;
}

/** Mapping from Shiki theme JSON keys to our color roles */
export interface ShikiColorMapping {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  subtle: string;
  accent: string;
  emphasis: string;
  auxiliary: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}
