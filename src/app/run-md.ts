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
import { FileNotFoundError, InvalidThemeError, PagerError, StdinReadError } from './errors';

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
  const exists = yield* Effect.tryPromise({
    catch: () => new FileNotFoundError({ path: filePath }),
    try: () => file.exists(),
  });
  if (!exists) {
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

const readFiles = Effect.fn('md.readFiles')((filePaths: readonly string[]) =>
  Effect.forEach(filePaths, readFile, { concurrency: 8 }),
);

const renderFiles = Effect.fn('md.renderFiles')(
  (
    files: readonly { path: string; content: string }[],
    config: MdConfig,
    layout: ReturnType<typeof calculateLayout>,
  ) =>
    Effect.forEach(
      files,
      (file) =>
        render(file.content, config).pipe(
          Effect.map((rendered) =>
            files.length > 1 ? `${renderFileHeader(file.path, layout)}\n\n${rendered}` : rendered,
          ),
        ),
      { concurrency: 4 },
    ),
);

export const runMd = Effect.fn('md.run')((flags: MdCliOptions) =>
  Effect.gen(function* runMdGen() {
    const config = yield* loadUserConfig();
    yield* Effect.sync(() => {
      setColorConfig(config.truecolor);
    });

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
      const { showBanner } = yield* Effect.tryPromise({
        catch: (cause) => new StdinReadError({ cause }),
        try: () => import('../ui/banner'),
      });
      yield* Effect.sync(() => {
        showBanner();
      });
      const selected = yield* showFilePicker().pipe(
        Effect.mapError((cause) => new StdinReadError({ cause })),
      );
      if (selected.length === 0) {
        return;
      }
      filePaths = [...selected];
    }

    const files: { path: string; content: string }[] =
      filePaths.length > 0
        ? yield* readFiles(filePaths)
        : [{ content: yield* readStdin(), path: '' }];

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

    const outputs = yield* renderFiles(files, resolvedConfig, layout);
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
      : pipeToLess(output, resolvedConfig.pager).pipe(
          Effect.mapError((cause) => new PagerError({ cause })),
        );
  }),
);

export type { MdCliOptions };
