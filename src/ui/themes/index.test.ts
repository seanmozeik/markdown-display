// src/ui/themes/index.test.ts
import { describe, expect, test } from 'bun:test';
import { getTheme, isValidTheme, loadTheme, theme } from './index';

describe('theme registry', () => {
  test('getTheme returns catppuccin-frappe by default', () => {
    const t = getTheme('catppuccin-frappe');
    expect(t.id).toBe('catppuccin-frappe');
    expect(t.name).toBe('Catppuccin Frappe');
    expect(t.type).toBe('dark');
  });

  test('getTheme returns correct theme for valid ID', () => {
    const t = getTheme('nord');
    expect(t.id).toBe('nord');
    expect(t.colors.bg).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test('getTheme returns catppuccin-frappe for invalid ID', () => {
    const t = getTheme('nonexistent-theme');
    expect(t.id).toBe('catppuccin-frappe');
  });

  test('isValidTheme returns true for valid themes', () => {
    expect(isValidTheme('nord')).toBe(true);
    expect(isValidTheme('dracula')).toBe(true);
  });

  test('isValidTheme returns false for invalid themes', () => {
    expect(isValidTheme('not-a-theme')).toBe(false);
  });

  test('loadTheme sets active theme', () => {
    loadTheme('nord');
    expect(theme().id).toBe('nord');

    loadTheme('dracula');
    expect(theme().id).toBe('dracula');
  });

  test('theme() returns active theme colors', () => {
    loadTheme('catppuccin-frappe');
    const t = theme();
    expect(t.colors.bg).toBeDefined();
    expect(t.colors.text).toBeDefined();
    expect(t.colors.accent).toBeDefined();
  });
});
