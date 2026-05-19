import { Effect } from 'effect';

import { type MdConfig, loadUserConfig } from '../config';
import { stripAnsi } from '../lib/ansi';
import { calculateLayout } from '../lib/layout';
import { countLines, PagingMode, pipeToLess, shouldUseColor, shouldUsePager } from '../lib/pager';
import { render } from '../lib/render';
import { getRawTerminalWidth, getTerminalHeight, getTerminalWidth } from '../lib/width';
import { showFilePicker } from '../ui/picker';
import { availableThemes, isValidTheme, loadTheme } from '../ui/themes';
import { setColorConfig } from '../ui/themes/color-support';
import { getSubtleColor } from '../ui/themes/semantic';
import { FileNotFoundError, InvalidThemeError, StdinReadError } from './errors';

interface MdCliOptions {
  readonly files: readonly string[];
  readonly listThemes: boolean;
  readonly noColor: boolean;
  readonly noPager: boolean;
  readonly plain: boolean;
  readonly raw: boolean;
  readonly scroll: boolean;
  readonly theme: string | undefined;
  readonly width: string | undefined;
  readonly wrap: boolean;
}

const readStdin = Effect.fn('md.readStdin')(function* readStdinGen() {
  return yield* Effect.tryPromise({
    catch: (cause) => new StdinReadError({ cause }),
    try: () => Bun.stdin.text(),
  });
});

const readFile = Effect.fn('md.readFile')(function* readFileGen(filePath: string) {
  const file = Bun.file(filePath);
  if (!(yield* Effect.promise(() => file.exists()))) {
    return yield* new FileNotFoundError({ path: filePath });
  }
  const content = yield* Effect.tryPromise({
    catch: () => new FileNotFoundError({ path: filePath }),
    try: () => file.text(),
  });
  return { content, path: filePath };
});

const renderFileHeader = (filePath: string, layout: ReturnType<typeof calculateLayout>): string => {
  const label = ` ${filePath} `;
  const leftPad = 3;
  const rightLen = Math.max(0, layout.contentWidth - leftPad - label.length);
  const header = getSubtleColor()(`${'─'.repeat(leftPad)}${label}${'─'.repeat(rightLen)}`);
  return layout.sidePadding > 0 ? ' '.repeat(layout.sidePadding) + header : header;
};

const applyCliOverrides = (config: MdConfig, flags: MdCliOptions): MdConfig => {
  const next = { ...config, code: { ...config.code }, display: { ...config.display } };
  if (flags.width !== undefined) {
    next.width = Number.parseInt(flags.width, 10);
    next.display = { ...next.display, maxWidth: 0 };
  }
  if (flags.scroll) {
    next.code = { ...next.code, wrap: false };
  }
  if (flags.wrap) {
    next.code = { ...next.code, wrap: true };
  }
  return next;
};

const listThemes = Effect.fn('md.listThemes')(function* listThemesGen() {
  yield* Effect.sync(() => {
    console.log('Available themes:\n');
    for (const id of availableThemes()) {
      console.log(`  ${id}`);
    }
  });
});

export const runMd = Effect.fn('md.run')((flags: MdCliOptions) =>
  Effect.gen(function* runMdGen() {
    const config = yield* loadUserConfig();
    setColorConfig(config.truecolor);

    if (flags.listThemes) {
      yield* listThemes();
      return;
    }

    const themeName = flags.theme ?? config.theme;
    yield* flags.theme !== undefined && !isValidTheme(flags.theme)
      ? Effect.fail(new InvalidThemeError({ theme: flags.theme }))
      : Effect.sync(() => {
          loadTheme(themeName);
        });

    let filePaths = [...flags.files];
    const hasStdin = !process.stdin.isTTY;
    const stdoutTTY = process.stdout.isTTY;
    const stdinTTY = process.stdin.isTTY;

    if (filePaths.length === 0 && !hasStdin) {
      const { showBanner } = yield* Effect.promise(() => import('../ui/banner'));
      yield* Effect.sync(() => {
        showBanner();
      });
      const selected = yield* Effect.tryPromise({
        catch: (cause) => new StdinReadError({ cause }),
        try: () => showFilePicker(),
      });
      if (selected.length === 0) {
        return;
      }
      filePaths = [...selected];
    }

    const files: { path: string; content: string }[] = [];
    if (filePaths.length > 0) {
      for (const filePath of filePaths) {
        files.push(yield* readFile(filePath));
      }
    } else {
      const content = yield* readStdin();
      files.push({ content, path: '' });
    }

    if (flags.raw) {
      yield* Effect.sync(() => {
        console.log(files.map((f) => f.content).join('\n'));
      });
      return;
    }

    const resolvedConfig = applyCliOverrides(config, flags);

    const outputWidth: number =
      resolvedConfig.width === 'auto' ? getTerminalWidth() : resolvedConfig.width;
    const rawTerminalWidth = getRawTerminalWidth();
    const layout = calculateLayout(rawTerminalWidth, outputWidth, {
      maxWidth: resolvedConfig.display.maxWidth,
      padding: resolvedConfig.display.padding,
    });

    const outputs: string[] = [];
    for (const file of files) {
      const rendered = yield* Effect.promise(() => render(file.content, resolvedConfig));
      if (files.length > 1) {
        outputs.push(`${renderFileHeader(file.path, layout)}\n\n${rendered}`);
      } else {
        outputs.push(rendered);
      }
    }
    let output = outputs.join('\n\n');

    const useColor = shouldUseColor() && !flags.plain && !flags.noColor;
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
      stdoutTTY,
    });

    yield* pagingMode === PagingMode.Never
      ? Effect.sync(() => {
          console.log(output);
        })
      : Effect.promise(() => pipeToLess(output, resolvedConfig.pager));
  }),
);

export type { MdCliOptions };
