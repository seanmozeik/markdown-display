import { Effect } from 'effect';

import { type CodeConfig, formatCodeBlockBox, highlightCodeBlockSource } from './elements/code';

/** Parallel Shiki passes for documents with many fences (claudewatch-style bounded concurrency). */
export const CODE_BLOCK_HIGHLIGHT_CONCURRENCY = 8;

export interface CodeBlockRef {
  readonly id: string;
  readonly code: string;
  readonly lang: string;
}

export const renderCodeBlocksParallel = Effect.fn('md.render-code-blocks')(
  (blocks: readonly CodeBlockRef[], config: CodeConfig, themeId: string) =>
    Effect.forEach(
      blocks,
      (block) =>
        Effect.gen(function* renderCodeBlockEntryGen() {
          const highlighted = yield* highlightCodeBlockSource(block.code, block.lang, themeId);
          return { id: block.id, rendered: formatCodeBlockBox(highlighted, block.lang, config) };
        }),
      { concurrency: CODE_BLOCK_HIGHLIGHT_CONCURRENCY },
    ).pipe(Effect.map((items) => new Map(items.map((item) => [item.id, item.rendered] as const)))),
);
