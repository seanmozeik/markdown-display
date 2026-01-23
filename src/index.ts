#!/usr/bin/env bun

import pkg from '../package.json' with { type: 'json' };
import { stripAnsi } from './lib/ansi';
import { getConfigPath, loadConfig } from './lib/config';
import { countLines, PagingMode, pipeToLess, shouldUseColor, shouldUsePager } from './lib/pager';
import { render } from './lib/render';
import { getTerminalHeight, getTerminalWidth } from './lib/width';
import { frappe, pc, theme } from './ui/theme';

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
  noPager: args.includes('--no-pager'),
  plain: args.includes('--plain') || args.includes('-p'),
  raw: args.includes('--raw') || args.includes('-r'),
  scroll: args.includes('--scroll'),
  version: args.includes('--version') || args.includes('-v'),
  width: getArgValue(args, '-w') ?? getArgValue(args, '--width'),
  wrap: args.includes('--wrap')
};

if (flags.version) {
  console.log(`md v${version}`);
  process.exit(0);
}

if (flags.help) {
  const helpText = `${theme.heading('Usage:')}
  ${frappe.mauve('md')} ${pc.dim('[file]')} ${pc.dim('[options]')}

${theme.heading('Options:')}
  ${frappe.green('-h, --help')}        Show this help message
  ${frappe.green('-v, --version')}     Show version number
  ${frappe.green('-w, --width <n>')}   Set output width (default: auto)
  ${frappe.green('-p, --plain')}       No colors, just structure
  ${frappe.green('-r, --raw')}         Pass through without rendering
  ${frappe.green('--no-pager')}        Write directly, never use pager
  ${frappe.green('--scroll')}          Horizontal scroll for code blocks
  ${frappe.green('--wrap')}            Wrap code blocks (default)

${theme.heading('Examples:')}
  ${pc.dim('$')} md README.md
  ${pc.dim('$')} md docs/guide.md --width 80
  ${pc.dim('$')} cat file.md | md`;

  console.log(helpText);
  process.exit(0);
}

async function main(): Promise<void> {
  const filePath = args.find((arg) => !arg.startsWith('-') && arg !== flags.width);
  const hasStdin = !process.stdin.isTTY;
  const stdoutTTY = process.stdout.isTTY ?? false;
  const stdinTTY = process.stdin.isTTY ?? true;

  if (!filePath && !hasStdin) {
    console.log(theme.muted('No file specified. Use --help for usage information.'));
    process.exit(1);
  }

  let content: string;
  if (filePath) {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      console.error(frappe.red(`Error: File not found: ${filePath}`));
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

  const config = await loadConfig(getConfigPath());

  if (flags.width) {
    (config as { width: number | 'auto' }).width = parseInt(flags.width, 10);
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
  console.error(frappe.red(String(err)));
  process.exit(1);
});
