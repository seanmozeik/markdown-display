import { Schema } from 'effect';

export class InvalidThemeError extends Schema.TaggedErrorClass<InvalidThemeError>()(
  'InvalidThemeError',
  { theme: Schema.String },
) {}
