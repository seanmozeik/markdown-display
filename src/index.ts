#!/usr/bin/env bun

import boxen from 'boxen';
import pkg from '../package.json' with { type: 'json' };
import { showBanner } from './ui/banner.js';
import { boxColors, frappe, pc, theme } from './ui/theme.js';

const args = Bun.argv.slice(2);
const version = pkg.version;

// Version flag
if (args.includes('--version') || args.includes('-v')) {
  console.log(`md v${version}`);
  process.exit(0);
}

// Help flag
if (args.includes('--help') || args.includes('-h')) {
  showBanner();
  console.log(pc.dim(`v${version}`));
  console.log();

  const helpText = `${theme.heading('Usage:')}
  ${frappe.mauve('md')} ${pc.dim('[file]')} ${pc.dim('[options]')}

${theme.heading('Arguments:')}
  ${frappe.blue('file')}              Markdown file to display

${theme.heading('Options:')}
  ${frappe.green('-h, --help')}        Show this help message
  ${frappe.green('-v, --version')}     Show version number
  ${frappe.green('-p, --pager')}       Use pager for long content
  ${frappe.green('-w, --width')}       Set output width (default: terminal width)

${theme.heading('Examples:')}
  ${pc.dim('$')} md README.md
  ${pc.dim('$')} md docs/guide.md --width 80
  ${pc.dim('$')} cat file.md | md`;

  console.log(
    boxen(helpText, {
      borderColor: boxColors.primary,
      borderStyle: 'round',
      padding: 1
    })
  );
  process.exit(0);
}

async function main(): Promise<void> {
  const filePath = args.find((arg) => !arg.startsWith('-'));

  // Check for piped input
  const hasStdin = !process.stdin.isTTY;

  if (!filePath && !hasStdin) {
    showBanner();
    console.log(pc.dim(`v${version}`));
    console.log();
    console.log(theme.muted('No file specified. Use --help for usage information.'));
    process.exit(1);
  }

  if (filePath) {
    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
      console.error(frappe.red(`Error: File not found: ${filePath}`));
      process.exit(1);
    }

    const content = await file.text();
    console.log(content);
  } else if (hasStdin) {
    const content = await Bun.stdin.text();
    console.log(content);
  }
}

main().catch((err) => {
  console.error(frappe.red(String(err)));
  process.exit(1);
});
