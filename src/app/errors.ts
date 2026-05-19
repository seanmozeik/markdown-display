import type { ConfigParseError } from '../config/errors';
import type { ConfigReadError } from '../config/read-error';
import type { FileNotFoundError } from './file-not-found-error';
import type { InvalidThemeError } from './invalid-theme-error';
import type { PagerError } from './pager-error';
import type { StdinReadError } from './stdin-read-error';

export type MdAppError =
  | ConfigParseError
  | ConfigReadError
  | FileNotFoundError
  | InvalidThemeError
  | PagerError
  | StdinReadError;

export { FileNotFoundError } from './file-not-found-error';
export { InvalidThemeError } from './invalid-theme-error';
export { PagerError } from './pager-error';
export { StdinReadError } from './stdin-read-error';
