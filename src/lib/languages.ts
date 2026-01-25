// src/lib/languages.ts

interface LanguageInfo {
  icon: string;
  label: string;
  color: string;
}

// Nerd Font icons for programming languages (from nvim-web-devicons)
// Reference: icons.lua - replace __ICON_X__ placeholders with icons from that file
export const LANGUAGES: Record<string, LanguageInfo> = {
  bash: { color: '#89E051', icon: '', label: 'bash' },
  c: { color: '#599EFF', icon: '', label: 'c' },
  clojure: { color: '#8DC149', icon: '', label: 'clj' },
  cmake: { color: '#DCE3EB', icon: '', label: 'cmake' },
  cpp: { color: '#519ABA', icon: '', label: 'cpp' },
  csharp: { color: '#596706', icon: '󰌛', label: 'cs' },
  css: { color: '#663399', icon: '', label: 'css' },
  csv: { color: '#89E051', icon: '', label: 'csv' },
  diff: { color: '#41535B', icon: '', label: 'diff' },
  dockerfile: { color: '#458EE6', icon: '󰡨', label: 'docker' },
  elixir: { color: '#A074C4', icon: '', label: 'ex' },
  erlang: { color: '#B83998', icon: '', label: 'erl' },
  go: { color: '#00ADD8', icon: '', label: 'go' },
  graphql: { color: '#E535AB', icon: '', label: 'gql' },
  haskell: { color: '#A074C4', icon: '', label: 'hs' },
  html: { color: '#E44D26', icon: '', label: 'html' },
  java: { color: '#CC3E44', icon: '', label: 'java' },
  javascript: { color: '#CBCB41', icon: '', label: 'js' },
  json: { color: '#CBCB41', icon: '', label: 'json' },
  julia: { color: '#A270BA', icon: '', label: 'jl' },
  kotlin: { color: '#7F52FF', icon: '', label: 'kt' },
  lua: { color: '#51A0CF', icon: '', label: 'lua' },
  makefile: { color: '#6D8086', icon: '', label: 'make' },
  markdown: { color: '#DDDDDD', icon: '', label: 'md' },
  nim: { color: '#F3D400', icon: '', label: 'nim' },
  ocaml: { color: '#E37933', icon: '', label: 'ml' },
  perl: { color: '#519ABA', icon: '', label: 'pl' },
  php: { color: '#A074C4', icon: '', label: 'php' },
  prisma: { color: '#5A67D8', icon: '', label: 'prisma' },
  python: { color: '#FFBC03', icon: '', label: 'py' },
  r: { color: '#2266BA', icon: '󰟔', label: 'r' },
  ruby: { color: '#701516', icon: '', label: 'rb' },
  rust: { color: '#DEA584', icon: '', label: 'rs' },
  scala: { color: '#CC3E44', icon: '', label: 'scala' },
  scss: { color: '#F55385', icon: '', label: 'scss' },
  shell: { color: '#4D5A5E', icon: '', label: 'sh' },
  sql: { color: '#DAD8D8', icon: '', label: 'sql' },
  svelte: { color: '#FF3E00', icon: '', label: 'svelte' },
  swift: { color: '#E37933', icon: '', label: 'swift' },
  tex: { color: '#3D6117', icon: '', label: 'tex' },
  toml: { color: '#9C4221', icon: '', label: 'toml' },
  typescript: { color: '#519ABA', icon: '', label: 'ts' },
  vim: { color: '#019833', icon: '', label: 'vim' },
  vue: { color: '#8DC149', icon: '', label: 'vue' },
  xml: { color: '#E37933', icon: '󰗀', label: 'xml' },
  yaml: { color: '#6D8086', icon: '', label: 'yaml' },
  zig: { color: '#F69A1B', icon: '', label: 'zig' }
};

// Aliases for common short names and variants
const LANG_ALIASES: Record<string, string> = {
  cc: 'cpp',
  cjs: 'javascript',
  cs: 'csharp',
  cxx: 'cpp',
  erl: 'erlang',
  ex: 'elixir',
  exs: 'elixir',
  h: 'c',
  hpp: 'cpp',
  hs: 'haskell',
  jl: 'julia',
  js: 'javascript',
  kt: 'kotlin',
  md: 'markdown',
  mjs: 'javascript',
  ml: 'ocaml',
  pl: 'perl',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  ts: 'typescript',
  yml: 'yaml'
};

export function normalizeLang(lang: string): string {
  const lower = lang.toLowerCase();
  return LANG_ALIASES[lower] ?? lower;
}

export function getLanguageLabel(lang: string, nerdFontsEnabled: boolean): string {
  const normalized = normalizeLang(lang);
  const info = LANGUAGES[normalized];
  return nerdFontsEnabled && info?.icon ? info.icon : normalized;
}

export function resolveNerdFonts(configValue: 'auto' | boolean): boolean {
  return configValue === 'auto' ? false : configValue;
}

// Terminals known to typically have nerd fonts installed
const NERD_FONT_TERMINALS = ['WezTerm', 'kitty', 'Alacritty'];

export function supportsNerdFonts(): boolean {
  // Explicit override via env var
  if (Bun.env.NERD_FONTS === '1' || Bun.env.NERD_FONTS === 'true') {
    return true;
  }
  if (Bun.env.NERD_FONTS === '0' || Bun.env.NERD_FONTS === 'false') {
    return false;
  }

  // Auto-detect based on terminal
  const term = Bun.env.TERM_PROGRAM ?? '';
  return NERD_FONT_TERMINALS.some((t) => term.includes(t));
}
