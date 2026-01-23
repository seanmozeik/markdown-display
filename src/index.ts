#!/usr/bin/env bun

import boxen from 'boxen';
import pc from 'picocolors';
import pkg from '../package.json' with { type: 'json' };
import { stripAnsi } from './lib/ansi';
import { getConfigPath, loadConfig } from './lib/config';
import { countLines, PagingMode, pipeToLess, shouldUseColor, shouldUsePager } from './lib/pager';
import { render } from './lib/render';
import { getTerminalHeight, getTerminalWidth } from './lib/width';
import { showBanner } from './ui/banner';
import { availableThemes, isValidTheme, loadTheme } from './ui/themes';
import {
  getAccentColor,
  getErrorColor,
  getHeadingColor,
  getHexColors,
  getMutedColor,
  getSuccessColor
} from './ui/themes/semantic';

const args = Bun.argv.slice(2);
const version = pkg.version;

function getArgValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

const flags = {
  help: args.includes('--help') || args.includes('-h'),
  listThemes: args.includes('--list-themes'),
  noPager: args.includes('--no-pager'),
  plain: args.includes('--plain') || args.includes('-p'),
  raw: args.includes('--raw') || args.includes('-r'),
  scroll: args.includes('--scroll'),
  theme: getArgValue(args, '-t') ?? getArgValue(args, '--theme'),
  version: args.includes('--version') || args.includes('-v'),
  width: getArgValue(args, '-w') ?? getArgValue(args, '--width'),
  wrap: args.includes('--wrap')
};

async function main(): Promise<void> {
  // Load config and initialize theme early so it's available for --version and --help
  const config = await loadConfig(getConfigPath());

  // Handle --list-themes before loading theme (doesn't need theme colors)
  if (flags.listThemes) {
    console.log('Available themes:\n');
    for (const id of availableThemes()) {
      console.log(`  ${id}`);
    }
    process.exit(0);
  }

  // CLI --theme flag overrides config
  const themeName = flags.theme ?? config.theme;
  if (flags.theme && !isValidTheme(flags.theme)) {
    console.error(`Invalid theme: ${flags.theme}`);
    console.error('Use --list-themes to see available themes.');
    process.exit(1);
  }
  loadTheme(themeName);

  // Get colors after theme is loaded
  const colors = getHexColors();
  const heading = getHeadingColor(1);
  const accent = getAccentColor();
  const success = getSuccessColor();
  const muted = getMutedColor();
  const error = getErrorColor();

  if (flags.version) {
    await showBanner();
    console.log(
      boxen(pc.dim(`v${version}`), {
        borderColor: colors.accent,
        borderStyle: 'round',
        padding: { bottom: 0, left: 2, right: 2, top: 0 }
      })
    );
    process.exit(0);
  }

  if (flags.help) {
    await showBanner();
    console.log(pc.dim(`v${version}`));
    console.log();

    const helpText = `${heading('Usage:')}
  ${accent('md')} ${pc.dim('[file]')} ${pc.dim('[options]')}

${heading('Options:')}
  ${success('-h, --help')}        Show this help message
  ${success('-v, --version')}     Show version number
  ${success('-w, --width <n>')}   Set output width (default: auto)
  ${success('-t, --theme <name>')} Color theme (e.g., nord, dracula)
  ${success('--list-themes')}     List all available themes
  ${success('-p, --plain')}       No colors, just structure
  ${success('-r, --raw')}         Pass through without rendering
  ${success('--no-pager')}        Write directly, never use pager
  ${success('--scroll')}          Horizontal scroll for code blocks
  ${success('--wrap')}            Wrap code blocks (default)

${heading('Examples:')}
  ${pc.dim('$')} md README.md
  ${pc.dim('$')} md docs/guide.md --width 80
  ${pc.dim('$')} cat file.md | md`;

    console.log(
      boxen(helpText, {
        borderColor: colors.accent,
        borderStyle: 'round',
        padding: 1
      })
    );
    process.exit(0);
  }

  const filePath = args.find(
    (arg) => !arg.startsWith('-') && arg !== flags.width && arg !== flags.theme
  );
  const hasStdin = !process.stdin.isTTY;
  const stdoutTTY = process.stdout.isTTY ?? false;
  const stdinTTY = process.stdin.isTTY ?? true;

  if (!filePath && !hasStdin) {
    console.log(muted('No file specified. Use --help for usage information.'));
    process.exit(1);
  }

  let content: string;
  if (filePath) {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      console.error(error(`Error: File not found: ${filePath}`));
      process.exit(1);
    }
    content = await file.text();
  } else {
    content = await Bun.stdin.text();
  }

  if (flags.raw) {
    console.log(content);
    return;
  }

  if (flags.width) {
    (config as { width: number | 'auto' }).width = parseInt(flags.width, 10);
    // Explicit --width overrides maxWidth constraint
    config.display.maxWidth = 0;
  }
  if (flags.scroll) config.code.wrap = false;
  if (flags.wrap) config.code.wrap = true;

  let output = await render(content, config);

  const useColor = shouldUseColor() && !flags.plain;
  if (!useColor) {
    output = stripAnsi(output);
  }

  const width = config.width === 'auto' ? getTerminalWidth() : config.width;
  const lines = countLines(output, width as number);
  const height = getTerminalHeight();

  const pagingMode = shouldUsePager({
    height,
    lines,
    noPager: flags.noPager,
    stdinTTY,
    stdoutTTY
  });

  if (pagingMode !== PagingMode.Never) {
    await pipeToLess(output, config.pager);
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  console.error(getErrorColor()(String(err)));
  process.exit(1);
});
