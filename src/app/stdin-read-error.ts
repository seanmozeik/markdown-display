import { Schema } from 'effect';

export class StdinReadError extends Schema.TaggedErrorClass<StdinReadError>()('StdinReadError', {
  cause: Schema.Unknown,
}) {}
