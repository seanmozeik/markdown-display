// src/lib/config.ts
import defaultToml from './default-config.toml';

export interface Config {
  theme: string;
  width: 'auto' | number;
  nerd_fonts: 'auto' | boolean;
  display: {
    padding: boolean;
    maxWidth: number;
  };
  code: {
    wrap: boolean;
    continuation: string;
  };
  text: {
    hyphenation: boolean;
    locale: string;
  };
  links: {
    osc8: 'auto' | boolean;
    show_urls: boolean;
  };
  pager: {
    command: string;
    args: string[];
  };
}

export const DEFAULT_CONFIG: Config = defaultToml as Config;

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const key in source) {
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
        sourceVal as Record<string, unknown>
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result;
}

export async function loadConfig(configPath: string): Promise<Config> {
  const file = Bun.file(configPath);
  const exists = await file.exists();

  if (!exists) {
    return DEFAULT_CONFIG;
  }

  const content = await file.text();
  const parsed = Bun.TOML.parse(content);
  return deepMerge(
    DEFAULT_CONFIG as unknown as Record<string, unknown>,
    parsed as Record<string, unknown>
  ) as unknown as Config;
}

export function getConfigPath(): string {
  const xdgConfig = Bun.env.XDG_CONFIG_HOME ?? `${Bun.env.HOME}/.config`;
  return `${xdgConfig}/md/config.toml`;
}
