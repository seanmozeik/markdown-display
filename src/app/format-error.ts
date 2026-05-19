import { Match } from 'effect';

import { ConfigParseError } from '../config/errors';
import { ConfigReadError } from '../config/read-error';
import { getErrorColor } from '../ui/themes/semantic';
import type { MdAppError } from './errors';
import { FileNotFoundError } from './file-not-found-error';
import { InvalidThemeError } from './invalid-theme-error';
import { StdinReadError } from './stdin-read-error';

const formatMdAppError = (error: MdAppError): string =>
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

const isMdAppError = (error: unknown): error is MdAppError =>
  error instanceof ConfigParseError ||
  error instanceof ConfigReadError ||
  error instanceof FileNotFoundError ||
  error instanceof InvalidThemeError ||
  error instanceof StdinReadError;

export { formatMdAppError, isMdAppError };
