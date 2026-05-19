// Scripts/build-themes.ts
/**
 * Build script: Extract color palettes from Shiki bundled themes.
 * Run with: bun run scripts/build-themes.ts
 */

import { themeOverrides } from '../src/ui/themes/overrides';
import type { ThemeColors, ThemePalette } from '../src/ui/themes/types';

const THEME_IDS = [
  'catppuccin-frappe',
  'catppuccin-latte',
  'catppuccin-macchiato',
  'catppuccin-mocha',
  'nord',
  'dracula',
  'dracula-soft',
  'gruvbox-dark-hard',
  'gruvbox-dark-medium',
  'gruvbox-dark-soft',
  'gruvbox-light-hard',
  'gruvbox-light-medium',
  'gruvbox-light-soft',
  'solarized-dark',
  'solarized-light',
  'tokyo-night',
  'one-dark-pro',
  'one-light',
  'github-dark',
  'github-dark-default',
  'github-dark-dimmed',
  'github-dark-high-contrast',
  'github-light',
  'github-light-default',
  'github-light-high-contrast',
  'rose-pine',
  'rose-pine-dawn',
  'rose-pine-moon',
  'material-theme',
  'material-theme-darker',
  'material-theme-lighter',
  'material-theme-ocean',
  'material-theme-palenight',
] as const;

const THEME_NAMES: Record<string, string> = {
  'catppuccin-frappe': 'Catppuccin Frappe',
  'catppuccin-latte': 'Catppuccin Latte',
  'catppuccin-macchiato': 'Catppuccin Macchiato',
  'catppuccin-mocha': 'Catppuccin Mocha',
  dracula: 'Dracula',
  'dracula-soft': 'Dracula Soft',
  'github-dark': 'GitHub Dark',
  'github-dark-default': 'GitHub Dark Default',
  'github-dark-dimmed': 'GitHub Dark Dimmed',
  'github-dark-high-contrast': 'GitHub Dark High Contrast',
  'github-light': 'GitHub Light',
  'github-light-default': 'GitHub Light Default',
  'github-light-high-contrast': 'GitHub Light High Contrast',
  'gruvbox-dark-hard': 'Gruvbox Dark Hard',
  'gruvbox-dark-medium': 'Gruvbox Dark Medium',
  'gruvbox-dark-soft': 'Gruvbox Dark Soft',
  'gruvbox-light-hard': 'Gruvbox Light Hard',
  'gruvbox-light-medium': 'Gruvbox Light Medium',
  'gruvbox-light-soft': 'Gruvbox Light Soft',
  'material-theme': 'Material Theme',
  'material-theme-darker': 'Material Theme Darker',
  'material-theme-lighter': 'Material Theme Lighter',
  'material-theme-ocean': 'Material Theme Ocean',
  'material-theme-palenight': 'Material Theme Palenight',
  nord: 'Nord',
  'one-dark-pro': 'One Dark Pro',
  'one-light': 'One Light',
  'rose-pine': 'Rose Pine',
  'rose-pine-dawn': 'Rose Pine Dawn',
  'rose-pine-moon': 'Rose Pine Moon',
  'solarized-dark': 'Solarized Dark',
  'solarized-light': 'Solarized Light',
  'tokyo-night': 'Tokyo Night',
};

const FALLBACK_HEX = '#888888';
const LUMINANCE_THRESHOLD = 0.5;

interface ShikiTheme {
  name: string;
  type?: 'light' | 'dark';
  colors: Record<string, string>;
}

const objectProperty = (obj: object, key: string): unknown => {
  const descriptor = Object.getOwnPropertyDescriptor(obj, key);
  return descriptor?.value;
};

const isShikiTheme = (value: unknown): value is ShikiTheme => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const colors = objectProperty(value, 'colors');
  return typeof colors === 'object' && colors !== null && !Array.isArray(colors);
};

const extractColor = (colors: Record<string, string>, ...keys: string[]): string => {
  for (const key of keys) {
    const value = colors[key];
    if (typeof value === 'string' && value.startsWith('#')) {
      return value.length > 7 ? value.slice(0, 7) : value;
    }
  }
  return FALLBACK_HEX;
};

const extractColors = (theme: ShikiTheme): ThemeColors => {
  const c = theme.colors;
  return {
    accent: extractColor(c, 'textLink.foreground', 'editorLink.activeForeground', 'focusBorder'),
    auxiliary: extractColor(c, 'textBlockQuote.border', 'textLink.foreground'),
    bg: extractColor(c, 'editor.background'),
    emphasis: extractColor(c, 'textPreformat.foreground', 'editor.foreground'),
    error: extractColor(
      c,
      'errorForeground',
      'editorError.foreground',
      'inputValidation.errorBorder',
    ),
    info: extractColor(c, 'editorInfo.foreground', 'textLink.foreground'),
    muted: extractColor(
      c,
      'editorLineNumber.foreground',
      'textBlockQuote.foreground',
      'descriptionForeground',
    ),
    subtle: extractColor(
      c,
      'editorIndentGuide.background',
      'editorRuler.foreground',
      'panel.border',
    ),
    success: extractColor(c, 'gitDecoration.addedResourceForeground', 'terminal.ansiGreen'),
    surface: extractColor(c, 'editorWidget.background', 'sideBar.background', 'editor.background'),
    text: extractColor(c, 'editor.foreground', 'foreground'),
    warning: extractColor(c, 'editorWarning.foreground', 'list.warningForeground'),
  };
};

const getThemeType = (theme: ShikiTheme): 'light' | 'dark' => {
  if (theme.type === 'light' || theme.type === 'dark') {
    return theme.type;
  }
  const bg = theme.colors['editor.background'] ?? '#000000';
  const hex = bg.replace('#', '').slice(0, 6);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > LUMINANCE_THRESHOLD ? 'light' : 'dark';
};

const loadShikiTheme = async (themeId: string): Promise<ShikiTheme> => {
  const module: unknown = await import(`@shikijs/themes/${themeId}`);
  if (typeof module !== 'object' || module === null) {
    throw new Error(`Invalid theme module for ${themeId}`);
  }
  const defaultExport = objectProperty(module, 'default');
  if (!isShikiTheme(defaultExport)) {
    throw new Error(`Theme ${themeId} is missing a valid default export`);
  }
  return defaultExport;
};

const buildThemePalette = async (themeId: string): Promise<ThemePalette> => {
  console.log(`Extracting: ${themeId}`);
  const shikiTheme = await loadShikiTheme(themeId);
  const colors = extractColors(shikiTheme);
  const type = getThemeType(shikiTheme);
  const overrides = themeOverrides[themeId];

  return {
    colors,
    id: themeId,
    name: THEME_NAMES[themeId] ?? themeId,
    shikiTheme: themeId,
    type,
    ...(overrides === undefined ? {} : { overrides }),
  };
};

const themes = await Promise.all(THEME_IDS.map((themeId) => buildThemePalette(themeId)));

const output = `// AUTO-GENERATED by scripts/build-themes.ts
// Do not edit manually - edit overrides.ts instead

import type { ThemePalette } from './types';

export const themes: Record<string, ThemePalette> = ${JSON.stringify(
  Object.fromEntries(themes.map((t) => [t.id, t])),
  null,
  2,
)};

export const themeIds = ${JSON.stringify(THEME_IDS)} as const;

export type ThemeId = typeof themeIds[number];
`;

await Bun.write('src/ui/themes/generated.ts', output);
console.log(`\nGenerated src/ui/themes/generated.ts with ${themes.length} themes`);
