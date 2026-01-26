import * as p from '@clack/prompts';
import fuzzysort from 'fuzzysort';
import { getTerminalHeight } from '../lib/width';
import { getMutedColor } from './themes/semantic';

type Option = { label: string; value: string };

/**
 * Find all markdown files in current directory, sorted by modification time.
 * Ignores node_modules, .git, and hidden directories.
 */
export async function findMarkdownFiles(): Promise<string[]> {
  const glob = new Bun.Glob('**/*.md');
  const files: string[] = [];

  for await (const file of glob.scan({
    cwd: '.',
    onlyFiles: true
  })) {
    // Skip ignored directories
    if (
      file.includes('node_modules/') ||
      file.includes('.git/') ||
      file.split('/').some((part) => part.startsWith('.') && part !== '.')
    ) {
      continue;
    }
    files.push(file);
  }

  // Sort by modification time (most recent first)
  const filesWithMtime = await Promise.all(
    files.map(async (file) => ({
      file,
      mtime: (await Bun.file(file).stat()).mtime
    }))
  );

  filesWithMtime.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return filesWithMtime.map((f) => f.file);
}

/**
 * Create a fuzzy filter function for use with @clack/prompts autocomplete.
 * Uses fuzzysort for fast, subsequence-based matching (like fzf/SublimeText).
 */
export function createFuzzyFilter() {
  return (input: string, options: Option[]): Option[] => {
    if (!input.trim()) return options;

    const results = fuzzysort.go(input, options, {
      key: 'label',
      limit: 100,
      threshold: 0.2
    });

    return results.map((r) => r.obj);
  };
}

/**
 * Show interactive file picker for markdown files.
 * Returns array of selected file paths, or empty array if cancelled/no files.
 */
export async function showFilePicker(): Promise<string[]> {
  const files = await findMarkdownFiles();

  if (files.length === 0) {
    console.log(getMutedColor()('No markdown files found in current directory.'));
    return [];
  }

  const allOptions = files.map((f) => ({ label: f, value: f }));
  const maxItems = Math.max(5, getTerminalHeight() - 6);
  const filter = createFuzzyFilter();

  const selected = await p.autocomplete({
    maxItems,
    message: 'Select a markdown file',
    options() {
      // Dynamic filtering based on user input
      const input = this.userInput || '';
      return filter(input, allOptions);
    }
  });

  if (p.isCancel(selected)) {
    return [];
  }

  return [selected as string];
}
