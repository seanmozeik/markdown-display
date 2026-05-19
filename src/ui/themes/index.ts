// Src/ui/themes/index.ts
import { type ThemeId, themeIds, themes } from './generated';
import type { ThemePalette } from './types';

const DEFAULT_THEME: ThemeId = 'catppuccin-frappe';
const fallbackTheme: ThemePalette = {
  colors: {
    accent: '#8caaee',
    auxiliary: '#232634',
    bg: '#303446',
    emphasis: '#c6d0f5',
    error: '#e78284',
    info: '#8caaee',
    muted: '#838ba7',
    subtle: '#51576d',
    success: '#a6d189',
    surface: '#292c3c',
    text: '#c6d0f5',
    warning: '#ef9f76',
  },
  id: DEFAULT_THEME,
  name: 'Catppuccin Frappe',
  shikiTheme: DEFAULT_THEME,
  type: 'dark',
};

const requireTheme = (id: ThemeId): ThemePalette => {
  const palette = themes[id];
  return palette ?? themes[DEFAULT_THEME] ?? fallbackTheme;
};

let activeTheme: ThemePalette = requireTheme(DEFAULT_THEME);

/** Check if a theme ID is valid */
const isValidTheme = (id: string): id is ThemeId => id in themes;

/** Get a theme by ID, returns default theme if not found */
const getTheme = (id: string): ThemePalette => {
  if (isValidTheme(id)) {
    return requireTheme(id);
  }
  return requireTheme(DEFAULT_THEME);
};

/** Set the active theme */
const loadTheme = (id: string): void => {
  activeTheme = getTheme(id);
};

/** Get the currently active theme */
const theme = (): ThemePalette => activeTheme;

/** Get all available theme IDs */
const availableThemes = (): readonly ThemeId[] => themeIds;

export type { ThemeColors, ThemeOverrides, ThemePalette } from './types';
export { ansiBg, ansiBold, ansiFg, ansiFgBg, ansiItalic, hexToAnsi256 } from './ansi';
export { availableThemes, getTheme, isValidTheme, loadTheme, theme, themeIds, type ThemeId };
