import { Schema } from 'effect';

export class ConfigParseError extends Schema.TaggedErrorClass<ConfigParseError>()(
  'ConfigParseError',
  { cause: Schema.Unknown, path: Schema.String },
) {}
