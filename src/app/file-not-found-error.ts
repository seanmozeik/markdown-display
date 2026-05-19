import { Schema } from 'effect';

export class FileNotFoundError extends Schema.TaggedErrorClass<FileNotFoundError>()(
  'FileNotFoundError',
  { path: Schema.String },
) {}
