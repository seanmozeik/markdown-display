import { Schema } from 'effect';

export class ConfigReadError extends Schema.TaggedErrorClass<ConfigReadError>()('ConfigReadError', {
  cause: Schema.Unknown,
  path: Schema.String,
}) {}
