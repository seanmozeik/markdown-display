import { Effect } from 'effect';

import defaultToml from '../lib/default-config.toml';
import { configTomlPath } from '../paths';
import { ConfigParseError } from './errors';
import { ConfigReadError } from './read-error';

export interface MdConfig {
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

export const DEFAULT_CONFIG: MdConfig = defaultToml as MdConfig;

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const deepMerge = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> => {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result;
};

const parseTomlConfig = (text: string, path: string): Record<string, unknown> => {
  let parsed: unknown;
  try {
    parsed = Bun.TOML.parse(text);
  } catch (error) {
    throw new ConfigParseError({ cause: error, path });
  }
  if (!isPlainRecord(parsed)) {
    throw new ConfigParseError({ cause: 'config.toml must parse to a table', path });
  }
  return parsed;
};

const normalizeConfig = (raw: Record<string, unknown>): MdConfig =>
  deepMerge(DEFAULT_CONFIG as unknown as Record<string, unknown>, raw) as unknown as MdConfig;

const loadConfigFileImpl = async (configPath: string): Promise<MdConfig> => {
  const file = Bun.file(configPath);
  if (!(await file.exists())) {
    return DEFAULT_CONFIG;
  }
  const parsed = parseTomlConfig(await file.text(), configPath);
  return normalizeConfig(parsed);
};

/** Load config from an explicit path (used in tests). */
export const loadConfigFile = (configPath: string): Promise<MdConfig> =>
  loadConfigFileImpl(configPath);

/**
 * Loads `~/.config/md/config.toml` when present; otherwise defaults.
 */
export const loadUserConfig = Effect.fn('config.load')(function* loadUserConfig() {
  const path = configTomlPath();
  const config = yield* Effect.tryPromise({
    catch: (cause) =>
      cause instanceof ConfigParseError ? cause : new ConfigReadError({ cause, path }),
    try: () => loadConfigFileImpl(path),
  });
  yield* Effect.annotateCurrentSpan({ path });
  return config;
});

export type { ConfigParseError } from './errors';
export type { ConfigReadError } from './read-error';
