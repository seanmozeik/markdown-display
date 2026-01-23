// src/ui/themes/index.ts
import { type ThemeId, themeIds, themes } from './generated';
import type { ThemePalette } from './types';

export type { ThemeColors, ThemeOverrides, ThemePalette } from './types';
export { themeIds, type ThemeId };
export { ansiBg, ansiBold, ansiFg, ansiFgBg, ansiItalic, hexToAnsi256 } from './ansi';

const DEFAULT_THEME: ThemeId = 'catppuccin-frappe';

// biome-ignore lint/style/noNonNullAssertion: DEFAULT_THEME is guaranteed to exist in themes
let activeTheme: ThemePalette = themes[DEFAULT_THEME]!;

/** Get a theme by ID, returns default theme if not found */
export function getTheme(id: string): ThemePalette {
  // biome-ignore lint/style/noNonNullAssertion: DEFAULT_THEME is guaranteed to exist in themes
  return themes[id as ThemeId] ?? themes[DEFAULT_THEME]!;
}

/** Check if a theme ID is valid */
export function isValidTheme(id: string): id is ThemeId {
  return id in themes;
}

/** Set the active theme */
export function loadTheme(id: string): void {
  activeTheme = getTheme(id);
}

/** Get the currently active theme */
export function theme(): ThemePalette {
  return activeTheme;
}

/** Get all available theme IDs */
export function availableThemes(): readonly ThemeId[] {
  return themeIds;
}
