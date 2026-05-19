import { Schema } from 'effect';

export class PagerError extends Schema.TaggedErrorClass<PagerError>()('PagerError', {
  cause: Schema.Unknown,
}) {}
