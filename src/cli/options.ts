import { Flag } from 'effect/unstable/cli';

const describe = <A>(flag: Flag.Flag<A>, description: string): Flag.Flag<A> =>
  flag.pipe(Flag.withDescription(description));

const optionalString = (name: string, description: string) =>
  describe(Flag.string(name).pipe(Flag.optional), description);

export const mdCliOptions = {
  listThemes: describe(Flag.boolean('list-themes'), 'List all available themes and exit'),
  noColor: describe(Flag.boolean('no-color'), 'Disable color output'),
  noPager: describe(Flag.boolean('no-pager'), 'Write directly, never use pager'),
  plain: describe(Flag.boolean('plain').pipe(Flag.withAlias('p')), 'No colors, just structure'),
  raw: describe(Flag.boolean('raw').pipe(Flag.withAlias('r')), 'Pass through without rendering'),
  scroll: describe(Flag.boolean('scroll'), 'Horizontal scroll for code blocks'),
  theme: optionalString('theme', 'Color theme (e.g. nord, dracula)').pipe(Flag.withAlias('t')),
  width: optionalString('width', 'Set output width').pipe(Flag.withAlias('w')),
  wrap: describe(Flag.boolean('wrap'), 'Wrap code blocks (default)'),
} satisfies Record<string, Flag.Flag<unknown>>;
