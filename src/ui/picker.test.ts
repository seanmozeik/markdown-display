import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('findMarkdownFiles', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'md-picker-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true });
  });

  test('finds markdown files in current directory', async () => {
    await Bun.write(join(tempDir, 'README.md'), '# Hello');
    await Bun.write(join(tempDir, 'CHANGELOG.md'), '# Changes');

    const { findMarkdownFiles } = await import('./picker');
    const files = await findMarkdownFiles();

    expect(files).toContain('README.md');
    expect(files).toContain('CHANGELOG.md');
    expect(files).toHaveLength(2);
  });

  test('finds markdown files in subdirectories', async () => {
    await Bun.write(join(tempDir, 'docs/guide.md'), '# Guide');

    const { findMarkdownFiles } = await import('./picker');
    const files = await findMarkdownFiles();

    expect(files).toContain('docs/guide.md');
  });

  test('ignores node_modules directory', async () => {
    await Bun.write(join(tempDir, 'README.md'), '# Hello');
    await Bun.write(join(tempDir, 'node_modules/pkg/README.md'), '# Pkg');

    const { findMarkdownFiles } = await import('./picker');
    const files = await findMarkdownFiles();

    expect(files).toContain('README.md');
    expect(files).not.toContain('node_modules/pkg/README.md');
  });

  test('ignores .git directory', async () => {
    await Bun.write(join(tempDir, 'README.md'), '# Hello');
    await Bun.write(join(tempDir, '.git/hooks/readme.md'), '# Hooks');

    const { findMarkdownFiles } = await import('./picker');
    const files = await findMarkdownFiles();

    expect(files).toContain('README.md');
    expect(files.some((f) => f.includes('.git'))).toBe(false);
  });

  test('ignores hidden directories', async () => {
    await Bun.write(join(tempDir, 'README.md'), '# Hello');
    await Bun.write(join(tempDir, '.hidden/secret.md'), '# Secret');

    const { findMarkdownFiles } = await import('./picker');
    const files = await findMarkdownFiles();

    expect(files).toContain('README.md');
    expect(files.some((f) => f.includes('.hidden'))).toBe(false);
  });

  test('returns empty array when no markdown files exist', async () => {
    await Bun.write(join(tempDir, 'file.txt'), 'text');

    const { findMarkdownFiles } = await import('./picker');
    const files = await findMarkdownFiles();

    expect(files).toEqual([]);
  });

  test('sorts files by modification time (most recent first)', async () => {
    // Create files with different mtimes
    await Bun.write(join(tempDir, 'old.md'), '# Old');
    await new Promise((r) => setTimeout(r, 50)); // Small delay
    await Bun.write(join(tempDir, 'new.md'), '# New');

    const { findMarkdownFiles } = await import('./picker');
    const files = await findMarkdownFiles();

    expect(files[0]).toBe('new.md');
    expect(files[1]).toBe('old.md');
  });
});

describe('createFuzzyFilter', () => {
  const options = [
    { label: 'README.md', value: 'README.md' },
    { label: 'docs/guide.md', value: 'docs/guide.md' },
    { label: 'docs/api.md', value: 'docs/api.md' },
    { label: 'src/lib/parser.md', value: 'src/lib/parser.md' }
  ];

  test('returns all options when input is empty', async () => {
    const { createFuzzyFilter } = await import('./picker');
    const filter = createFuzzyFilter();
    const result = filter('', options);
    expect(result).toEqual(options);
  });

  test('filters by exact substring match', async () => {
    const { createFuzzyFilter } = await import('./picker');
    const filter = createFuzzyFilter();
    const result = filter('guide', options);
    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe('docs/guide.md');
  });

  test('filters with fuzzy matching (transposition)', async () => {
    const { createFuzzyFilter } = await import('./picker');
    const filter = createFuzzyFilter();
    const result = filter('giude', options); // transposed 'u' and 'i'
    expect(result.some((r) => r.label === 'docs/guide.md')).toBe(true);
  });

  test('filters with fuzzy matching (deletion)', async () => {
    const { createFuzzyFilter } = await import('./picker');
    const filter = createFuzzyFilter();
    const result = filter('gude', options); // missing 'i'
    expect(result.some((r) => r.label === 'docs/guide.md')).toBe(true);
  });

  test('filters case-insensitively', async () => {
    const { createFuzzyFilter } = await import('./picker');
    const filter = createFuzzyFilter();
    const result = filter('README', options);
    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe('README.md');
  });

  test('returns empty array when no matches', async () => {
    const { createFuzzyFilter } = await import('./picker');
    const filter = createFuzzyFilter();
    const result = filter('xyz123', options);
    expect(result).toEqual([]);
  });

  test('matches partial paths', async () => {
    const { createFuzzyFilter } = await import('./picker');
    const filter = createFuzzyFilter();
    const result = filter('docs/api', options);
    expect(result.some((r) => r.label === 'docs/api.md')).toBe(true);
  });

  test('matches out-of-order terms', async () => {
    const { createFuzzyFilter } = await import('./picker');
    const filter = createFuzzyFilter();
    const result = filter('api docs', options);
    expect(result.some((r) => r.label === 'docs/api.md')).toBe(true);
  });
});

describe('showFilePicker', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'md-picker-show-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tempDir, { recursive: true });
  });

  test('returns empty array when no markdown files found', async () => {
    await Bun.write(join(tempDir, 'file.txt'), 'text');

    const { showFilePicker } = await import('./picker');
    const result = await showFilePicker();

    expect(result).toEqual([]);
  });
});
