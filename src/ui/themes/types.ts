// src/ui/themes/types.ts

/** Core color roles for markdown rendering */
export interface ThemeColors {
  bg: string; // Main background
  surface: string; // Elevated surfaces (code blocks, boxes)
  text: string; // Body text
  muted: string; // Secondary text, blockquotes
  subtle: string; // Borders, decorations
  accent: string; // Headings, links
  emphasis: string; // Bold text
  auxiliary: string; // Italic text
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
  name: string; // Display name (e.g., "Catppuccin Frappe")
  id: string; // Theme ID (e.g., "catppuccin-frappe")
  shikiTheme: string; // Shiki theme ID for code highlighting
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
