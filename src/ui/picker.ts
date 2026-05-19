import { autocomplete, isCancel } from '@clack/prompts';
import { Effect, Schema } from 'effect';
import fuzzysort from 'fuzzysort';

import { getTerminalHeight } from '../lib/width';
import { getMutedColor } from './themes/semantic';

interface Option {
  label: string;
  value: string;
}

class PickerError extends Schema.TaggedErrorClass<PickerError>()('PickerError', {
  cause: Schema.Unknown,
}) {}

const MIN_PICKER_ITEMS = 5;
const PICKER_VERTICAL_RESERVE = 6;

const isHiddenPathSegment = (part: string): boolean => part.startsWith('.') && part !== '.';

const shouldSkipMarkdownPath = (file: string): boolean =>
  file.includes('node_modules/') ||
  file.includes('.git/') ||
  file.split('/').some((part) => isHiddenPathSegment(part));

/**
 * Find all markdown files in current directory, sorted by modification time.
 * Ignores node_modules, .git, and hidden directories.
 */
const scanMarkdownFiles = async (): Promise<string[]> => {
  const glob = new Bun.Glob('**/*.md');
  const files: string[] = [];

  for await (const file of glob.scan({ cwd: '.', onlyFiles: true })) {
    if (!shouldSkipMarkdownPath(file)) {
      files.push(file);
    }
  }

  const filesWithMtime = await Promise.all(
    files.map(async (file) => {
      const stat = await Bun.file(file).stat();
      return { file, mtime: stat.mtime };
    }),
  );

  filesWithMtime.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return filesWithMtime.map((entry) => entry.file);
};

const findMarkdownFiles = Effect.fn('md.find-markdown-files')(function* findMarkdownFilesGen() {
  return yield* Effect.tryPromise({
    catch: (cause) => new PickerError({ cause }),
    try: () => scanMarkdownFiles(),
  });
});

/**
 * Create a fuzzy filter function for use with @clack/prompts autocomplete.
 * Uses fuzzysort for fast, subsequence-based matching (like fzf/SublimeText).
 */
const createFuzzyFilter = (): ((input: string, options: Option[]) => Option[]) => {
  return (input: string, options: Option[]): Option[] => {
    if (input.trim().length === 0) {
      return options;
    }

    const results = fuzzysort.go(input, options, { key: 'label', limit: 100, threshold: 0.2 });

    return results.map((result) => result.obj);
  };
};

const isStringSelection = (value: unknown): value is string => typeof value === 'string';

/**
 * Show interactive file picker for markdown files.
 * Returns array of selected file paths, or empty array if cancelled/no files.
 */
const showFilePicker = Effect.fn('md.show-file-picker')(function* showFilePickerGen() {
  const files = yield* findMarkdownFiles();

  if (files.length === 0) {
    yield* Effect.sync(() => {
      console.log(getMutedColor()('No markdown files found in current directory.'));
    });
    return [];
  }

  const allOptions = files.map((f) => ({ label: f, value: f }));
  const maxItems = Math.max(MIN_PICKER_ITEMS, getTerminalHeight() - PICKER_VERTICAL_RESERVE);
  const filter = createFuzzyFilter();

  const selected = yield* Effect.tryPromise({
    catch: (cause) => new PickerError({ cause }),
    try: () =>
      autocomplete({
        maxItems,
        message: 'Select a markdown file',
        options() {
          const input = this.userInput || '';
          return filter(input, allOptions);
        },
      }),
  });

  if (isCancel(selected)) {
    return [];
  }

  if (!isStringSelection(selected)) {
    return [];
  }

  return [selected];
});

export { createFuzzyFilter, findMarkdownFiles, PickerError, showFilePicker };
