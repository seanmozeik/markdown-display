import { Effect } from 'effect';

import defaultToml from '../lib/default-config.toml';
import { configTomlPath } from '../paths';
import { ConfigParseError } from './errors';
import { ConfigReadError } from './read-error';

interface MdConfig {
  theme: string;
  width: 'auto' | number;
  truecolor: 'auto' | boolean;
  nerd_fonts: 'auto' | boolean;
  display: { padding: boolean; maxWidth: number };
  code: { wrap: boolean; continuation: string };
  text: { hyphenation: boolean; locale: string };
  links: { osc8: 'auto' | boolean; show_urls: boolean };
  pager: { command: string; args: string[] };
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const baseConfigRecord = isPlainRecord(defaultToml) ? defaultToml : {};

const deepMerge = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (isPlainRecord(sourceVal) && isPlainRecord(targetVal)) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result;
};

const parseTomlConfig = Effect.fn('config.parse-toml')(function* parseTomlConfigGen(
  text: string,
  path: string,
) {
  const parsed = yield* Effect.try({
    catch: (cause) => new ConfigParseError({ cause, path }),
    try: () => Bun.TOML.parse(text),
  });
  if (!isPlainRecord(parsed)) {
    return yield* new ConfigParseError({ cause: `${path} must be a TOML table`, path });
  }
  return parsed;
});

const readBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const readString = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

const readWidth = (value: unknown, fallback: MdConfig['width']): MdConfig['width'] =>
  value === 'auto' || typeof value === 'number' ? value : fallback;

const isTriState = (value: unknown): value is 'auto' | boolean =>
  value === 'auto' || typeof value === 'boolean';

const readTriState = (value: unknown, fallback: 'auto' | boolean): 'auto' | boolean =>
  isTriState(value) ? value : fallback;

const readNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' ? value : fallback;

const readStringList = (value: unknown, fallback: string[]): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : fallback;

const recordField = (
  merged: Record<string, unknown>,
  base: Record<string, unknown>,
  key: string,
): Record<string, unknown> => {
  if (isPlainRecord(merged[key])) {
    return merged[key];
  }
  if (isPlainRecord(base[key])) {
    return base[key];
  }
  return {};
};

const readMaxWidth = (merged: Record<string, unknown>, base: Record<string, unknown>): number => {
  const mergedDisplay = recordField(merged, base, 'display');
  const baseDisplay = isPlainRecord(base['display']) ? base['display'] : {};
  return readNumber(mergedDisplay['maxWidth'], readNumber(baseDisplay['maxWidth'], 0));
};

const buildMdConfig = (merged: Record<string, unknown>): MdConfig => {
  const base = baseConfigRecord;
  const mergedCode = recordField(merged, base, 'code');
  const baseCode = recordField(base, base, 'code');
  const mergedDisplay = recordField(merged, base, 'display');
  const baseDisplay = recordField(base, base, 'display');
  const mergedLinks = recordField(merged, base, 'links');
  const baseLinks = recordField(base, base, 'links');
  const mergedPager = recordField(merged, base, 'pager');
  const basePager = recordField(base, base, 'pager');
  const mergedText = recordField(merged, base, 'text');
  const baseText = recordField(base, base, 'text');

  return {
    code: {
      continuation: readString(
        mergedCode['continuation'],
        readString(baseCode['continuation'], '→'),
      ),
      wrap: readBoolean(mergedCode['wrap'], readBoolean(baseCode['wrap'], true)),
    },
    display: {
      maxWidth: readMaxWidth(merged, base),
      padding: readBoolean(mergedDisplay['padding'], readBoolean(baseDisplay['padding'], true)),
    },
    links: {
      osc8: readTriState(mergedLinks['osc8'], readTriState(baseLinks['osc8'], 'auto')),
      show_urls: readBoolean(mergedLinks['show_urls'], readBoolean(baseLinks['show_urls'], false)),
    },
    nerd_fonts: readTriState(merged['nerd_fonts'], readTriState(base['nerd_fonts'], 'auto')),
    pager: {
      args: readStringList(mergedPager['args'], readStringList(basePager['args'], [])),
      command: readString(mergedPager['command'], readString(basePager['command'], 'less')),
    },
    text: {
      hyphenation: readBoolean(
        mergedText['hyphenation'],
        readBoolean(baseText['hyphenation'], true),
      ),
      locale: readString(mergedText['locale'], readString(baseText['locale'], 'en-us')),
    },
    theme: readString(merged['theme'], readString(base['theme'], 'catppuccin-frappe')),
    truecolor: readTriState(merged['truecolor'], readTriState(base['truecolor'], 'auto')),
    width: readWidth(merged['width'], readWidth(base['width'], 'auto')),
  };
};

const normalizeConfig = (raw: Record<string, unknown>): MdConfig =>
  buildMdConfig(deepMerge(baseConfigRecord, raw));

const DEFAULT_CONFIG: MdConfig = normalizeConfig({});

const loadConfigFile = Effect.fn('config.load-file')(function* loadConfigFileGen(
  configPath: string,
) {
  const file = Bun.file(configPath);
  const exists = yield* Effect.tryPromise({
    catch: (cause) => new ConfigReadError({ cause, path: configPath }),
    try: () => file.exists(),
  });
  if (!exists) {
    return DEFAULT_CONFIG;
  }
  const text = yield* Effect.tryPromise({
    catch: (cause) => new ConfigReadError({ cause, path: configPath }),
    try: () => file.text(),
  });
  const parsed = yield* parseTomlConfig(text, configPath);
  return normalizeConfig(parsed);
});

/**
 * Loads `~/.config/md/config.toml` when present; otherwise defaults.
 */
const loadUserConfig = Effect.fn('config.load')(function* loadUserConfig() {
  const path = configTomlPath();
  const config = yield* loadConfigFile(path);
  yield* Effect.annotateCurrentSpan({ path });
  return config;
});

export type { MdConfig };
export type { ConfigParseError } from './errors';
export type { ConfigReadError } from './read-error';
export { DEFAULT_CONFIG, loadConfigFile, loadUserConfig };
