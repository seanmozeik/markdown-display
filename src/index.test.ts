// src/index.test.ts
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { $ } from 'bun';

describe('md CLI', () => {
  const testFile = '/tmp/md-test.md';

  beforeAll(async () => {
    await Bun.write(testFile, '# Test\n\nHello world');
  });

  afterAll(async () => {
    await $`rm -f ${testFile}`.quiet();
  });

  test('--version shows version', async () => {
    const result = await $`bun run src/index.ts --version`.text();
    expect(result).toMatch(/v\d+\.\d+\.\d+/);
    // Banner shows figlet ASCII art + version in box
    expect(result).toContain('╭');
  });

  test('--help shows help', async () => {
    const result = await $`bun run src/index.ts --help`.text();
    expect(result).toContain('Usage');
  });

  test('renders markdown file', async () => {
    const result = await $`bun run src/index.ts ${testFile} --no-pager`.text();
    // Strip soft hyphens for comparison (hyphenation inserts \u00AD)
    const normalized = result.replace(/\u00AD/g, '');
    expect(normalized).toContain('Test');
    expect(normalized).toContain('Hello world');
  });

  test('--raw passes through without rendering', async () => {
    const result = await $`bun run src/index.ts ${testFile} --raw`.text();
    expect(result).toContain('# Test');
  });

  test('errors on missing file', async () => {
    const proc = $`bun run src/index.ts /nonexistent/file.md`.nothrow();
    const result = await proc;
    expect(result.exitCode).not.toBe(0);
  });
});
