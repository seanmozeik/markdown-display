// src/ui/themes/overrides.ts
import type { ThemeOverrides } from './types';

/**
 * Manual overrides for themes with specific character.
 * Only define what differs from the auto-extracted base palette.
 */
export const themeOverrides: Record<string, ThemeOverrides> = {
  'catppuccin-frappe': {
    bold: '#f4b8e4', // pink
    h1: '#ca9ee6', // mauve
    h2: '#babbf1', // lavender
    h3: '#8caaee', // blue
    h4: '#81c8be', // teal
    inlineCode: { bg: '#292c3c', fg: '#f2d5cf' }, // rosewater on mantle
    italic: '#99d1db' // sky
  },
  'catppuccin-latte': {
    bold: '#ea76cb',
    h1: '#8839ef',
    h2: '#7287fd',
    h3: '#1e66f5',
    h4: '#179299',
    inlineCode: { bg: '#e6e9ef', fg: '#dc8a78' },
    italic: '#04a5e5'
  },
  'catppuccin-macchiato': {
    bold: '#f5bde6',
    h1: '#c6a0f6',
    h2: '#b7bdf8',
    h3: '#8aadf4',
    h4: '#8bd5ca',
    inlineCode: { bg: '#1e2030', fg: '#f4dbd6' },
    italic: '#91d7e3'
  },
  'catppuccin-mocha': {
    bold: '#f5c2e7',
    h1: '#cba6f7',
    h2: '#b4befe',
    h3: '#89b4fa',
    h4: '#94e2d5',
    inlineCode: { bg: '#181825', fg: '#f5e0dc' },
    italic: '#89dceb'
  },
  dracula: {
    bold: '#ff79c6',
    h1: '#bd93f9',
    h2: '#ff79c6',
    h3: '#8be9fd',
    italic: '#8be9fd'
  },
  'dracula-soft': {
    bold: '#ff79c6',
    h1: '#bd93f9',
    h2: '#ff79c6',
    h3: '#8be9fd',
    italic: '#8be9fd'
  },
  nord: {
    bold: '#88c0d0',
    h1: '#88c0d0',
    h2: '#81a1c1',
    h3: '#5e81ac',
    italic: '#81a1c1'
  },
  'rose-pine': {
    bold: '#ebbcba',
    h1: '#c4a7e7',
    h2: '#ebbcba',
    h3: '#9ccfd8',
    italic: '#9ccfd8'
  },
  'rose-pine-dawn': {
    bold: '#d7827e',
    h1: '#907aa9',
    h2: '#d7827e',
    h3: '#56949f',
    italic: '#56949f'
  },
  'rose-pine-moon': {
    bold: '#ebbcba',
    h1: '#c4a7e7',
    h2: '#ebbcba',
    h3: '#9ccfd8',
    italic: '#9ccfd8'
  },
  'tokyo-night': {
    bold: '#bb9af7',
    h1: '#bb9af7',
    h2: '#7aa2f7',
    h3: '#7dcfff',
    italic: '#7dcfff'
  }
};
