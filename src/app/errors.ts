import { Schema } from 'effect';

import type { ConfigParseError } from '../config/errors';
import type { ConfigReadError } from '../config/read-error';

export class FileNotFoundError extends Schema.TaggedErrorClass<FileNotFoundError>()(
  'FileNotFoundError',
  { path: Schema.String },
) {}

export class InvalidThemeError extends Schema.TaggedErrorClass<InvalidThemeError>()(
  'InvalidThemeError',
  { theme: Schema.String },
) {}

export class StdinReadError extends Schema.TaggedErrorClass<StdinReadError>()('StdinReadError', {
  cause: Schema.Unknown,
}) {}

export type MdAppError =
  | ConfigParseError
  | ConfigReadError
  | FileNotFoundError
  | InvalidThemeError
  | StdinReadError;
