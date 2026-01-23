// src/lib/config.test.ts
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_CONFIG, loadConfig } from './config';

describe('loadConfig', () => {
  const testConfigDir = '/tmp/md-test-config';
  const testConfigPath = join(testConfigDir, 'config.toml');

  beforeEach(async () => {
    await mkdir(testConfigDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await unlink(testConfigPath);
    } catch {}
  });

  test('returns default config when no user config exists', async () => {
    const config = await loadConfig('/nonexistent/path');
    expect(config.theme).toBe('frappe');
    expect(config.width).toBe('auto');
    expect(config.code.wrap).toBe(true);
  });

  test('merges user config with defaults', async () => {
    await Bun.write(testConfigPath, 'theme = "mocha"\nwidth = 100');
    const config = await loadConfig(testConfigPath);
    expect(config.theme).toBe('mocha');
    expect(config.width).toBe(100);
    expect(config.code.wrap).toBe(true); // default preserved
  });

  test('deeply merges nested config', async () => {
    await Bun.write(testConfigPath, '[code]\nwrap = false');
    const config = await loadConfig(testConfigPath);
    expect(config.code.wrap).toBe(false);
    expect(config.code.continuation).toBe('↪'); // default preserved
  });
});

describe('DEFAULT_CONFIG', () => {
  test('has expected structure', () => {
    expect(DEFAULT_CONFIG.theme).toBe('frappe');
    expect(DEFAULT_CONFIG.code.theme).toBe('catppuccin-frappe');
    expect(DEFAULT_CONFIG.text.hyphenation).toBe(true);
    expect(DEFAULT_CONFIG.links.osc8).toBe('auto');
    expect(DEFAULT_CONFIG.pager.args).toContain('-R');
  });

  test('has display config with defaults', () => {
    expect(DEFAULT_CONFIG.display.padding).toBe(true);
    expect(DEFAULT_CONFIG.display.maxWidth).toBe(0);
  });
});
