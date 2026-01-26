#!/usr/bin/env bun

import boxen from 'boxen';
import pc from 'picocolors';
import pkg from '../package.json' with { type: 'json' };
import { stripAnsi } from './lib/ansi';
import { getConfigPath, loadConfig } from './lib/config';
import { calculateLayout } from './lib/layout';
import { countLines, PagingMode, pipeToLess, shouldUseColor, shouldUsePager } from './lib/pager';
import { render } from './lib/render';
import { getRawTerminalWidth, getTerminalHeight, getTerminalWidth } from './lib/width';
import { showBanner } from './ui/banner';
import { availableThemes, isValidTheme, loadTheme } from './ui/themes';
import { setColorConfig } from './ui/themes/color-support';
import {
  getAccentColor,
  getErrorColor,
  getHeadingColor,
  getHexColors,
  getMutedColor,
  getSubtleColor,
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
  noColor: args.includes('--no-color'),
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

  // Initialize color support based on config
  setColorConfig(config.truecolor);

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

  // Get colors after theme is loaded (used for help/version display)
  const colors = getHexColors();

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

    const h = getHeadingColor(1);
    const accent = getAccentColor();
    const opt = getSuccessColor();
    const helpText = `${h('Usage:')}
  ${accent('md')} ${pc.dim('[file...]')} ${pc.dim('[options]')}

${h('Options:')}
  ${opt('-h, --help')}        Show this help message
  ${opt('-v, --version')}     Show version number
  ${opt('-w, --width <n>')}   Set output width (default: auto)
  ${opt('-t, --theme <name>')} Color theme (e.g., nord, dracula)
  ${opt('--list-themes')}     List all available themes
  ${opt('-p, --plain')}       No colors, just structure
  ${opt('-r, --raw')}         Pass through without rendering
  ${opt('--no-pager')}        Write directly, never use pager
  ${opt('--scroll')}          Horizontal scroll for code blocks
  ${opt('--wrap')}            Wrap code blocks (default)

${h('Examples:')}
  ${pc.dim('$')} md README.md
  ${pc.dim('$')} md README.md CHANGELOG.md
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

  const flagValues = new Set([flags.width, flags.theme]);
  const filePaths = args.filter((arg) => !arg.startsWith('-') && !flagValues.has(arg));
  const hasStdin = !process.stdin.isTTY;
  const stdoutTTY = process.stdout.isTTY ?? false;
  const stdinTTY = process.stdin.isTTY ?? true;

  if (filePaths.length === 0 && !hasStdin) {
    console.log(getMutedColor()('No file specified. Use --help for usage information.'));
    process.exit(1);
  }

  // Read file contents
  const files: Array<{ path: string; content: string }> = [];
  if (filePaths.length > 0) {
    for (const filePath of filePaths) {
      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        console.error(getErrorColor()(`Error: File not found: ${filePath}`));
        process.exit(1);
      }
      files.push({ content: await file.text(), path: filePath });
    }
  } else {
    files.push({ content: await Bun.stdin.text(), path: '' });
  }

  if (flags.raw) {
    console.log(files.map((f) => f.content).join('\n'));
    return;
  }

  if (flags.width) {
    (config as { width: number | 'auto' }).width = parseInt(flags.width, 10);
    // Explicit --width overrides maxWidth constraint
    config.display.maxWidth = 0;
  }
  if (flags.scroll) config.code.wrap = false;
  if (flags.wrap) config.code.wrap = true;

  // Calculate layout for consistent width handling
  const outputWidth: number = config.width === 'auto' ? getTerminalWidth() : config.width;
  const rawTerminalWidth = getRawTerminalWidth();
  const layout = calculateLayout(rawTerminalWidth, outputWidth, {
    maxWidth: config.display.maxWidth,
    padding: config.display.padding
  });

  // Render file header for multi-file display (matches body content width/padding)
  function renderFileHeader(filePath: string): string {
    const label = ` ${filePath} `;
    const leftPad = 3;
    const rightLen = Math.max(0, layout.contentWidth - leftPad - label.length);
    const header = getSubtleColor()(`${'─'.repeat(leftPad)}${label}${'─'.repeat(rightLen)}`);
    // Apply same padding as body content
    return layout.sidePadding > 0 ? ' '.repeat(layout.sidePadding) + header : header;
  }

  // Render each file
  const outputs: string[] = [];
  for (const file of files) {
    const rendered = await render(file.content, config);
    if (files.length > 1) {
      outputs.push(`${renderFileHeader(file.path)}\n\n${rendered}`);
    } else {
      outputs.push(rendered);
    }
  }
  let output = outputs.join('\n\n');

  const useColor = shouldUseColor() && !flags.plain;
  if (!useColor) {
    output = stripAnsi(output);
  }

  const lines = countLines(output, outputWidth);
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
