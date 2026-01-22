// src/lib/icons.ts

// Nerd Font icons for programming languages (from nvim-web-devicons)
export const LANGUAGE_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  bash: { color: '#4D5A5E', icon: '', label: 'sh' },
  c: { color: '#599EFF', icon: '', label: 'c' },
  clojure: { color: '#8DC149', icon: '', label: 'clj' },
  cmake: { color: '#6D8086', icon: '', label: 'cmake' },
  cpp: { color: '#519ABA', icon: '', label: 'cpp' },
  csharp: { color: '#596706', icon: '󰌛', label: 'cs' },
  css: { color: '#663399', icon: '', label: 'css' },
  csv: { color: '#89E051', icon: '', label: 'csv' },
  diff: { color: '#41535B', icon: '', label: 'diff' },
  docker: { color: '#2496ED', icon: '', label: 'docker' },
  dockerfile: { color: '#2496ED', icon: '', label: 'docker' },
  elixir: { color: '#6E4A7E', icon: '', label: 'ex' },
  erlang: { color: '#A90533', icon: '', label: 'erl' },
  git: { color: '#F14C28', icon: '', label: 'git' },
  go: { color: '#00ADD8', icon: '', label: 'go' },
  graphql: { color: '#E535AB', icon: '', label: 'gql' },
  haskell: { color: '#5E5086', icon: '', label: 'hs' },
  html: { color: '#E44D26', icon: '', label: 'html' },
  java: { color: '#CC3E44', icon: '', label: 'java' },
  javascript: { color: '#CBCB41', icon: '', label: 'js' },
  json: { color: '#CBCB41', icon: '', label: 'json' },
  julia: { color: '#9558B2', icon: '', label: 'jl' },
  kotlin: { color: '#7F52FF', icon: '', label: 'kt' },
  lua: { color: '#51A0CF', icon: '', label: 'lua' },
  makefile: { color: '#6D8086', icon: '', label: 'make' },
  markdown: { color: '#DDDDDD', icon: '', label: 'md' },
  nginx: { color: '#009639', icon: '', label: 'nginx' },
  nim: { color: '#FFE953', icon: '', label: 'nim' },
  ocaml: { color: '#E98407', icon: '', label: 'ml' },
  perl: { color: '#39457E', icon: '', label: 'pl' },
  php: { color: '#A074C4', icon: '', label: 'php' },
  prisma: { color: '#5A67D8', icon: '', label: 'prisma' },
  python: { color: '#FFBC03', icon: '', label: 'py' },
  r: { color: '#276DC3', icon: '', label: 'r' },
  react: { color: '#61DAFB', icon: '', label: 'jsx' },
  ruby: { color: '#701516', icon: '', label: 'rb' },
  rust: { color: '#DEA584', icon: '', label: 'rs' },
  scala: { color: '#DC322F', icon: '', label: 'scala' },
  scss: { color: '#CB6698', icon: '', label: 'scss' },
  shell: { color: '#4D5A5E', icon: '', label: 'sh' },
  sql: { color: '#DAD8D8', icon: '', label: 'sql' },
  svelte: { color: '#FF3E00', icon: '', label: 'svelte' },
  swift: { color: '#E37933', icon: '', label: 'swift' },
  tex: { color: '#3D6117', icon: '', label: 'tex' },
  toml: { color: '#6D8086', icon: '', label: 'toml' },
  typescript: { color: '#519ABA', icon: '󰛑', label: 'ts' },
  vim: { color: '#019833', icon: '', label: 'vim' },
  vue: { color: '#41B883', icon: '', label: 'vue' },
  xml: { color: '#E37933', icon: '󰗀', label: 'xml' },
  yaml: { color: '#6D8086', icon: '', label: 'yaml' },
  zig: { color: '#F7A41D', icon: '', label: 'zig' }
};

// Aliases for common short names
const LANG_ALIASES: Record<string, string> = {
  cc: 'cpp',
  cjs: 'javascript',
  cs: 'csharp',
  cxx: 'cpp',
  erl: 'erlang',
  ex: 'elixir',
  exs: 'elixir',
  fish: 'bash',
  h: 'c',
  hpp: 'cpp',
  hs: 'haskell',
  jl: 'julia',
  js: 'javascript',
  jsx: 'javascript',
  kt: 'kotlin',
  md: 'markdown',
  mjs: 'javascript',
  ml: 'ocaml',
  pl: 'perl',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  sh: 'bash',
  ts: 'typescript',
  tsx: 'typescript',
  yml: 'yaml',
  zsh: 'bash'
};

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

export function getLanguageIcon(lang: string, useNerdFonts: boolean): string {
  const normalized = LANG_ALIASES[lang.toLowerCase()] ?? lang.toLowerCase();
  const entry = LANGUAGE_ICONS[normalized];

  if (!entry) return '';

  return useNerdFonts ? entry.icon : entry.label;
}

export function getLanguageColor(lang: string): string | undefined {
  const normalized = LANG_ALIASES[lang.toLowerCase()] ?? lang.toLowerCase();
  return LANGUAGE_ICONS[normalized]?.color;
}
