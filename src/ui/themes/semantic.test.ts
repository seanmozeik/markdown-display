// src/ui/themes/semantic.test.ts
import { beforeEach, describe, expect, test } from 'bun:test';
import { loadTheme } from './index';
import {
  getBoldStyle,
  getHeadingColor,
  getInlineCodeStyle,
  getItalicStyle,
  getLinkColor,
  getMutedColor,
  getTextColor
} from './semantic';

describe('semantic colors', () => {
  beforeEach(() => {
    loadTheme('catppuccin-frappe');
  });

  test('getBoldStyle returns override when available', () => {
    const style = getBoldStyle();
    expect(style('test')).toContain('\x1b[1;'); // bold
    expect(style('test')).toContain('test');
  });

  test('getItalicStyle returns override when available', () => {
    const style = getItalicStyle();
    expect(style('test')).toContain('\x1b[3;'); // italic
  });

  test('getInlineCodeStyle returns fg+bg combination', () => {
    const style = getInlineCodeStyle();
    const result = style('code');
    expect(result).toContain('code');
    expect(result).toContain('\x1b['); // has ANSI codes
  });

  test('getHeadingColor returns level-appropriate colors', () => {
    const h1 = getHeadingColor(1);
    const h2 = getHeadingColor(2);
    const h3 = getHeadingColor(3);

    expect(typeof h1).toBe('function');
    expect(h1('H1')).toContain('H1');
    expect(h2('H2')).toContain('H2');
    expect(h3('H3')).toContain('H3');
  });

  test('getLinkColor returns accent color', () => {
    const link = getLinkColor();
    expect(link('link')).toContain('link');
  });

  test('getTextColor returns text color', () => {
    const text = getTextColor();
    expect(text('body')).toContain('body');
  });

  test('getMutedColor returns muted color', () => {
    const muted = getMutedColor();
    expect(muted('dim')).toContain('dim');
  });

  test('uses base colors when no override defined', () => {
    loadTheme('gruvbox-dark-medium'); // No overrides defined
    const bold = getBoldStyle();
    expect(bold('test')).toContain('test');
  });
});
