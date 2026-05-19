// Src/lib/pager.ts
import { Effect, Schema } from 'effect';

import { stripAnsi } from './ansi';

class PagerPipeError extends Schema.TaggedErrorClass<PagerPipeError>()('PagerPipeError', {
  cause: Schema.Unknown,
}) {}

enum PagingMode {
  Always = 'always',
  QuitIfOneScreen = 'quit-if-one-screen',
  Never = 'never',
}

interface PagerConfig {
  command: string;
  args: string[];
}

interface PagingContext {
  stdoutTTY: boolean;
  stdinTTY: boolean;
  lines: number;
  height: number;
  noPager?: boolean;
  forceAlways?: boolean;
}

export const shouldUsePager = (ctx: PagingContext): PagingMode => {
  if (ctx.noPager === true || !ctx.stdoutTTY) {
    return PagingMode.Never;
  }
  if (ctx.forceAlways === true) {
    return PagingMode.Always;
  }
  if (ctx.lines <= ctx.height) {
    return PagingMode.Never;
  }
  return PagingMode.QuitIfOneScreen;
};

export const getPagerCommand = (
  config: PagerConfig,
): { command: string; args: string[]; env: Record<string, string> } => {
  // Priority: config > MD_PAGER > PAGER > less (bat pattern)
  const command = config.command || (Bun.env.MD_PAGER ?? Bun.env.PAGER ?? 'less');

  // For less, inject smart defaults if no args configured
  let { args } = config;
  if (command === 'less' && args.length === 0) {
    // Raw control chars (nerd fonts), quit-if-one-screen, quit-on-interrupt, no-init
    args = ['-r', '-F', '-K', '-X'];
  }

  return {
    args,
    command,
    env: {
      LESSCHARSET: 'utf8',
      // Display Unicode PUA chars (nerd fonts) as-is, not escaped
      LESSUTFBINFMT: '*d',
    },
  };
};

export const countLines = (content: string, width?: number): number => {
  if (content.length === 0) {
    return 1;
  }

  const lines = content.split('\n');
  if (width === undefined || width === 0) {
    return lines.length;
  }

  let total = 0;
  for (const line of lines) {
    const visibleLength = stripAnsi(line).length;
    total += Math.max(1, Math.ceil(visibleLength / width));
  }
  return total;
};

export const pipeToLess = Effect.fn('md.pipe-to-less')(function* pipeToLessGen(
  content: string,
  config: PagerConfig,
) {
  const { command, args, env } = getPagerCommand(config);

  const proc = Bun.spawn([command, ...args], {
    env: { ...process.env, ...env },
    stderr: 'inherit',
    stdin: 'pipe',
    stdout: 'inherit',
  });

  yield* Effect.tryPromise({
    catch: (cause) => new PagerPipeError({ cause }),
    try: () => Promise.resolve(proc.stdin.write(content)),
  });
  yield* Effect.tryPromise({
    catch: (cause) => new PagerPipeError({ cause }),
    try: () => Promise.resolve(proc.stdin.end()),
  });

  yield* Effect.tryPromise({
    catch: (cause) => new PagerPipeError({ cause }),
    try: () => proc.exited,
  });
});

export const shouldUseColor = (): boolean => {
  // Respect NO_COLOR standard (bat pattern)
  if (Bun.env.NO_COLOR !== undefined) {
    return false;
  }
  return process.stdout.isTTY;
};

export { PagerPipeError, PagingMode };
