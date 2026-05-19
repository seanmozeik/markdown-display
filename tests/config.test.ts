// Src/lib/config.test.ts
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { Effect } from 'effect';

import { DEFAULT_CONFIG, loadConfigFile } from '../src/config/index';

describe('loadConfigFile', () => {
  const testConfigDir = '/tmp/md-test-config';
  const testConfigPath = join(testConfigDir, 'config.toml');

  beforeEach(async () => {
    await mkdir(testConfigDir, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(testConfigPath)) {
      await unlink(testConfigPath);
    }
  });

  test('returns default config when no user config exists', async () => {
    const config = await Effect.runPromise(loadConfigFile('/nonexistent/path/config.toml'));
    expect(config.theme).toBe('frappe');
    expect(config.width).toBe('auto');
    expect(config.code.wrap).toBe(true);
  });

  test('merges user config with defaults', async () => {
    await Bun.write(testConfigPath, 'theme = "mocha"\nwidth = 100');
    const config = await Effect.runPromise(loadConfigFile(testConfigPath));
    expect(config.theme).toBe('mocha');
    expect(config.width).toBe(100);
    expect(config.code.wrap).toBe(true); // Default preserved
  });

  test('deeply merges nested config', async () => {
    await Bun.write(testConfigPath, '[code]\nwrap = false');
    const config = await Effect.runPromise(loadConfigFile(testConfigPath));
    expect(config.code.wrap).toBe(false);
    expect(config.code.continuation).toBe('→'); // Default preserved
  });
});

describe('DEFAULT_CONFIG', () => {
  test('has expected structure', () => {
    expect(DEFAULT_CONFIG.theme).toBe('frappe');
    expect(DEFAULT_CONFIG.text.hyphenation).toBe(true);
    expect(DEFAULT_CONFIG.links.osc8).toBe('auto');
    expect(DEFAULT_CONFIG.pager.args).toContain('-r');
  });

  test('has display config with defaults', () => {
    expect(DEFAULT_CONFIG.display.padding).toBe(true);
    expect(DEFAULT_CONFIG.display.maxWidth).toBe(0);
  });

  test('has truecolor config with auto default', () => {
    expect(DEFAULT_CONFIG.truecolor).toBe('auto');
  });
});
