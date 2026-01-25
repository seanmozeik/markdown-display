// src/lib/pager.ts
import { stripAnsi } from './ansi';

export enum PagingMode {
  Always = 'always',
  QuitIfOneScreen = 'quit-if-one-screen',
  Never = 'never'
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

export function shouldUsePager(ctx: PagingContext): PagingMode {
  if (ctx.noPager || !ctx.stdoutTTY) return PagingMode.Never;
  if (ctx.forceAlways) return PagingMode.Always;
  if (ctx.lines <= ctx.height) return PagingMode.Never;
  return PagingMode.QuitIfOneScreen;
}

export function getPagerCommand(config: PagerConfig): {
  command: string;
  args: string[];
  env: Record<string, string>;
} {
  // Priority: config > MD_PAGER > PAGER > less (bat pattern)
  const command = config.command || Bun.env.MD_PAGER || Bun.env.PAGER || 'less';

  // For less, inject smart defaults if no args configured
  let args = config.args;
  if (command === 'less' && args.length === 0) {
    args = ['-r', '-F', '-K', '-X']; // Raw control chars (for nerd fonts), quit-if-one-screen, quit-on-interrupt, no-init
  }

  return {
    args,
    command,
    env: {
      LESSCHARSET: 'UTF-8', // Ensure UTF-8 (bat pattern)
      LESSUTFBINFMT: '*d' // Display Unicode PUA chars (nerd fonts) as-is, not escaped
    }
  };
}

export function countLines(content: string, width?: number): number {
  if (!content) return 1;

  const lines = content.split('\n');
  if (!width) return lines.length;

  return lines.reduce((total, line) => {
    const visibleLength = stripAnsi(line).length;
    return total + Math.max(1, Math.ceil(visibleLength / width));
  }, 0);
}

export async function pipeToLess(content: string, config: PagerConfig): Promise<void> {
  const { command, args, env } = getPagerCommand(config);

  const proc = Bun.spawn([command, ...args], {
    env: { ...process.env, ...env },
    stderr: 'inherit',
    stdin: 'pipe',
    stdout: 'inherit'
  });

  proc.stdin.write(content);
  proc.stdin.end();

  await proc.exited;
}

export function shouldUseColor(): boolean {
  // Respect NO_COLOR standard (bat pattern)
  if (Bun.env.NO_COLOR !== undefined) {
    return false;
  }
  return process.stdout.isTTY ?? false;
}
