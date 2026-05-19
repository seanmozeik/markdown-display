import { Match } from 'effect';

import type { ConfigParseError } from '../config/errors';
import type { ConfigReadError } from '../config/read-error';
import { getErrorColor } from '../ui/themes/semantic';
import type { MdAppError } from './errors';

export const formatMdAppError = (error: MdAppError): string =>
  Match.value(error).pipe(
    Match.tagsExhaustive({
      ConfigParseError: (e: ConfigParseError) =>
        getErrorColor()(`Config parse error (${e.path}): ${String(e.cause)}`),
      ConfigReadError: (e: ConfigReadError) =>
        getErrorColor()(`Config read error (${e.path}): ${String(e.cause)}`),
      FileNotFoundError: (e) => getErrorColor()(`Error: File not found: ${e.path}`),
      InvalidThemeError: (e) =>
        getErrorColor()(`Invalid theme: ${e.theme}\nUse --list-themes to see available themes.`),
      StdinReadError: (e) => getErrorColor()(`Read error: ${String(e.cause)}`),
    }),
  );

const MD_APP_ERROR_TAGS = new Set([
  'ConfigParseError',
  'ConfigReadError',
  'FileNotFoundError',
  'InvalidThemeError',
  'StdinReadError',
]);

export const isMdAppError = (error: unknown): error is MdAppError =>
  typeof error === 'object' &&
  error !== null &&
  '_tag' in error &&
  typeof (error as { _tag: unknown })._tag === 'string' &&
  MD_APP_ERROR_TAGS.has((error as { _tag: string })._tag);
