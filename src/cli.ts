#!/usr/bin/env bun

const hasArg = (name: string): boolean => process.argv.includes(name);

const wantsRaw = (): boolean => hasArg('--raw') || hasArg('-r');

const isFlagValue = (args: readonly string[], index: number): boolean => {
  const previous = args[index - 1];
  return previous === '--theme' || previous === '-t' || previous === '--width' || previous === '-w';
};

const rawInputFiles = (): string[] =>
  process.argv.slice(2).filter((arg, index, args) => {
    if (arg === '--raw' || arg === '-r') {
      return false;
    }
    if (arg.startsWith('-')) {
      return false;
    }
    return !isFlagValue(args, index);
  });

const runRaw = async (): Promise<void> => {
  const files = rawInputFiles();
  const chunks: string[] = [];

  if (files.length === 0) {
    chunks.push(await Bun.stdin.text());
  } else {
    chunks.push(...(await Promise.all(files.map((path) => Bun.file(path).text()))));
  }

  console.log(chunks.join('\n'));
};

const runCli = async (): Promise<void> => {
  if (wantsRaw()) {
    await runRaw();
    return;
  }

  const { runCliApp } = await import('./cli-app');
  runCliApp();
};

const formatBootstrapError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const isMain = (): boolean => {
  return import.meta.filename === Bun.main;
};

if (isMain()) {
  await runCli().catch((error: unknown) => {
    console.error(formatBootstrapError(error));
    process.exitCode = 1;
  });
}

export { runCli };
