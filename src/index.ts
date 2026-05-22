import type { Effect } from 'effect';

import { DEFAULT_CONFIG } from './config';
import type { MarkdownParseError } from './lib/parser';
import { render } from './lib/render';

export { CONFIG_DIR_NAME } from './constants';
export { configRoot, configTomlPath, expandHome } from './paths';
export {
  DEFAULT_CONFIG,
  loadConfigFile,
  loadUserConfig,
  type MdConfig,
  type ConfigParseError,
  type ConfigReadError,
} from './config';
export type {
  MdAppError,
  FileNotFoundError,
  InvalidThemeError,
  StdinReadError,
} from './app/errors';
export { formatMdAppError, isMdAppError } from './app/format-error';
export { showHelp, showVersion } from './app/cli-info';
export { runMd, type MdCliOptions } from './app/run-md';
export { app, program, runnableProgram, runtimeLayer } from './cli-app';
export { render } from './lib/render';
export {
  CODE_BLOCK_HIGHLIGHT_CONCURRENCY,
  renderCodeBlocksParallel,
  type CodeBlockRef,
} from './lib/render-code-blocks';
export { clearHighlightCache, highlightCode, stripItalicAnsi } from './lib/shiki';
export type { Config } from './lib/config';
export type { MarkdownParseError } from './lib/parser';

/**
 * Convenience function to render markdown with default configuration.
 * For advanced usage, use the Effect-based `render()` function with custom config.
 *
 * @example
 * ```ts
 * import { renderMarkdown } from '@seanmozeik/markdown-display';
 * import { Effect } from 'effect';
 *
 * const program = renderMarkdown('# Hello World');
 * Effect.runSync(program);
 * ```
 */
export const renderMarkdown = (markdown: string): Effect.Effect<string, MarkdownParseError> =>
  render(markdown, DEFAULT_CONFIG);
