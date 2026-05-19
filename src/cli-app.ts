#!/usr/bin/env bun
/* eslint-disable no-console */
import { BunRuntime, BunServices } from '@effect/platform-bun';
import { Cause, Effect, Layer, Logger, type LogLevel, Option, References } from 'effect';
import { Argument, Command } from 'effect/unstable/cli';

import pkg from '../package.json' with { type: 'json' };
import { showHelp, showVersion } from './app/cli-info';
import { formatMdAppError, isMdAppError } from './app/format-error';
import { runMd } from './app/run-md';
import { mdCliOptions } from './cli/options';
import { getErrorColor } from './ui/themes/semantic';

const filesArg = Argument.string('file').pipe(
  Argument.variadic(),
  Argument.withDescription('Markdown files to render'),
);

const md = Command.make('md', { files: filesArg, ...mdCliOptions }, (options) =>
  runMd({
    files: options.files,
    listThemes: options.listThemes,
    noColor: options.noColor,
    noPager: options.noPager,
    plain: options.plain,
    raw: options.raw,
    scroll: options.scroll,
    theme: Option.getOrUndefined(options.theme),
    width: Option.getOrUndefined(options.width),
    wrap: options.wrap,
  }),
).pipe(Command.withDescription('Beautiful terminal markdown viewer'));

const program = Command.run(md, { version: pkg.version });

const stderrLogger = Logger.make(({ logLevel, message }) => {
  let text: string;
  if (Array.isArray(message)) {
    text = message.map((m) => (typeof m === 'string' ? m : JSON.stringify(m))).join(' ');
  } else if (typeof message === 'string') {
    text = message;
  } else {
    text = JSON.stringify(message);
  }
  process.stderr.write(`[${logLevel.toLowerCase()}] ${text}\n`);
});

const verbose = process.argv.includes('--verbose');
const minLogLevel: LogLevel.LogLevel = verbose ? 'Debug' : 'Warn';

const runtimeLayer = Layer.mergeAll(
  BunServices.layer,
  Logger.layer([stderrLogger]),
  Layer.succeed(References.MinimumLogLevel, minLogLevel),
);

const formatUnknownError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
};

const writeBoundaryError = (error: unknown): void => {
  if (isMdAppError(error)) {
    console.error(formatMdAppError(error));
    process.exitCode = 1;
    return;
  }

  console.error(getErrorColor()(formatUnknownError(error)));
  process.exitCode = 1;
};

const wantsVersion = (): boolean =>
  process.argv.includes('--version') || process.argv.includes('-v');

const wantsHelp = (): boolean => process.argv.includes('--help') || process.argv.includes('-h');

const runnableProgram = Effect.gen(function* cliMain() {
  if (wantsVersion()) {
    yield* showVersion(pkg.version);
    return;
  }
  if (wantsHelp()) {
    yield* showHelp(pkg.version);
    return;
  }
  yield* program;
}).pipe(
  Effect.provide(runtimeLayer),
  Effect.catchCause((cause) =>
    Effect.sync(() => {
      const fail = cause.reasons.find(Cause.isFailReason);
      writeBoundaryError(fail === undefined ? cause : fail.error);
    }),
  ),
);

const runCliApp = (): void => {
  BunRuntime.runMain(runnableProgram);
};

if (import.meta.main) {
  runCliApp();
}

const app = md;

export { app, md, program, runnableProgram, runCliApp, runtimeLayer };
