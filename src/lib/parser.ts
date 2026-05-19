// Src/lib/parser.ts
import { Effect } from 'effect';
import { Marked, type RendererObject, type Token } from 'marked';

import { theme } from '../ui/themes';
import { getBoldStyle, getItalicStyle } from '../ui/themes/semantic';
import { renderBlockquote } from './elements/blockquote';
import { type CodeConfig, renderInlineCode } from './elements/code';
import { renderHeading } from './elements/heading';
import { renderLink } from './elements/link';
import { renderListItem } from './elements/list';
import { renderTable } from './elements/table';
import { renderText } from './elements/text';
import { renderCodeBlocksParallel } from './render-code-blocks';

interface ParseOptions {
  width: number;
  osc8?: boolean | 'auto';
  wrap?: boolean;
  hyphenation?: boolean;
  nerdFonts?: boolean;
  continuation?: string;
}

// Type for marked renderer context (this binding)
interface RendererThis {
  parser: { parse(tokens: Token[]): string; parseInline(tokens: Token[]): string };
}

const RANDOM_ID_RADIX = 36;

interface ListItemToken {
  tokens: Token[];
  task?: boolean;
  checked?: boolean;
}

interface NestedList {
  items: ListItemToken[];
  ordered: boolean;
  start?: number;
}

interface CodeToken {
  text: string;
  lang?: string;
}

const isNestedListToken = (
  token: Token,
): token is Token & { items: ListItemToken[]; ordered: boolean; start?: number } =>
  token.type === 'list' && 'items' in token && Array.isArray(token.items);

const isCodeToken = (token: Token): token is Token & CodeToken =>
  token.type === 'code' && 'text' in token && typeof token.text === 'string';

const createRenderer = (
  options: ParseOptions,
  codeBlocks: Map<string, { code: string; lang: string }>,
): RendererObject => {
  const classifyListItemTokens = (
    item: ListItemToken,
  ): { inlineTokens: Token[]; nestedLists: NestedList[]; blockContent: Token[] } => {
    const INLINE_TYPES = new Set([
      'text',
      'strong',
      'em',
      'codespan',
      'link',
      'image',
      'br',
      'del',
      'escape',
      'checkbox',
    ]);

    const inlineTokens: Token[] = [];
    const nestedLists: NestedList[] = [];
    const blockContent: Token[] = [];

    for (const t of item.tokens) {
      if (isNestedListToken(t)) {
        nestedLists.push({
          items: t.items.map((listItem) => ({
            tokens: listItem.tokens,
            ...(listItem.task === undefined ? {} : { task: listItem.task }),
            ...(listItem.checked === undefined ? {} : { checked: listItem.checked }),
          })),
          ordered: t.ordered,
          ...(typeof t.start === 'number' ? { start: t.start } : {}),
        });
      } else if (isCodeToken(t)) {
        const id = `__CODE_${Date.now()}_${Math.random().toString(RANDOM_ID_RADIX)}__`;
        codeBlocks.set(id, { code: t.text, lang: t.lang ?? '' });
        blockContent.push({ raw: id, text: id, type: 'html' } as Token);
      } else if (t.type === 'paragraph' && 'tokens' in t) {
        inlineTokens.push(...t.tokens);
      } else if (t.type === 'space') {
        // Whitespace between block content - skip
      } else if (t.type === 'html' && 'block' in t && t.block === false) {
        inlineTokens.push(t);
      } else if (INLINE_TYPES.has(t.type)) {
        inlineTokens.push(t);
      } else {
        blockContent.push(t);
      }
    }

    return { blockContent, inlineTokens, nestedLists };
  };

  const renderListWithDepth = (
    parser: RendererThis['parser'],
    items: ListItemToken[],
    ordered: boolean,
    start: number,
    depth: number,
  ): string => {
    return items
      .map((item, i) => {
        const { inlineTokens, nestedLists, blockContent } = classifyListItemTokens(item);

        const text = parser.parseInline(inlineTokens);
        const renderedItem = renderListItem(text, ordered, depth, start + i, {
          width: options.width,
          ...(item.checked === undefined ? {} : { checked: item.checked }),
          ...(item.task === undefined ? {} : { task: item.task }),
          ...(options.hyphenation === undefined ? {} : { hyphenation: options.hyphenation }),
          ...(options.nerdFonts === undefined ? {} : { nerdFonts: options.nerdFonts }),
        });

        // Render any block content (tables, blockquotes, code blocks, etc.)
        const blockRendered = blockContent.length > 0 ? parser.parse(blockContent).trim() : '';

        // Recursively render nested lists
        const nestedRendered = nestedLists
          .map((nested) =>
            renderListWithDepth(parser, nested.items, nested.ordered, nested.start ?? 1, depth + 1),
          )
          .join('\n');

        // Join: item text, then block content, then nested lists
        const parts = [renderedItem];
        if (blockRendered) {
          parts.push(blockRendered);
        }
        if (nestedRendered) {
          parts.push(nestedRendered);
        }
        return parts.join('\n');
      })
      .join('\n');
  };

  return {
    blockquote(this: RendererThis, { tokens }: { tokens: Token[] }): string {
      // Blockquotes contain block-level tokens (paragraphs, lists, etc.), not inline
      const text = this.parser.parse(tokens);
      const blockquoteConfig: { width: number; hyphenation?: boolean } = { width: options.width };
      if (options.hyphenation !== undefined) {
        blockquoteConfig.hyphenation = options.hyphenation;
      }
      return `${renderBlockquote(text.trim(), blockquoteConfig)}\n\n`;
    },
    br(): string {
      return '\n';
    },

    checkbox(): string {
      // Return empty - we render checkboxes in renderListItem based on task/checked flags
      return '';
    },

    code({ text, lang }: { text: string; lang?: string }): string {
      const id = `__CODE_${Date.now()}_${Math.random().toString(RANDOM_ID_RADIX)}__`;
      codeBlocks.set(id, { code: text, lang: lang ?? '' });
      return id;
    },

    codespan({ text }: { text: string }): string {
      return renderInlineCode(text);
    },

    em(this: RendererThis, { tokens }: { tokens: Token[] }): string {
      const text = this.parser.parseInline(tokens);
      return getItalicStyle()(text);
    },

    heading(this: RendererThis, { tokens, depth }: { tokens: Token[]; depth: number }): string {
      const text = this.parser.parseInline(tokens);
      return renderHeading(text, depth, options.width);
    },

    hr(): string {
      return `\n${'─'.repeat(options.width)}\n\n`;
    },

    html({ text }: { text: string }): string {
      if (/^<br\s*\/?>$/iu.test(text.trim())) {
        return '\n';
      }
      return text;
    },

    link(this: RendererThis, { href, tokens }: { href: string; tokens: Token[] }): string {
      const text = this.parser.parseInline(tokens);
      return renderLink(text, href, { osc8: options.osc8 ?? 'auto', show_urls: false });
    },

    list(
      this: RendererThis,
      { items, ordered, start }: { items: ListItemToken[]; ordered: boolean; start: number | '' },
    ): string {
      return `${renderListWithDepth(this.parser, items, ordered, typeof start === 'number' ? start : 1, 0)}\n`;
    },

    listitem(this: RendererThis, { tokens }: { tokens: Token[] }): string {
      return this.parser.parseInline(tokens);
    },

    paragraph(this: RendererThis, { tokens }: { tokens: Token[] }): string {
      const text = this.parser.parseInline(tokens);
      return `${renderText(text, { hyphenation: options.hyphenation ?? true, width: options.width })}\n`;
    },

    strong(this: RendererThis, { tokens }: { tokens: Token[] }): string {
      const text = this.parser.parseInline(tokens);
      return getBoldStyle()(text);
    },

    table({ header, rows }: { header: { text: string }[]; rows: { text: string }[][] }): string {
      return `${renderTable(
        header.map((h) => h.text),
        rows.map((row) => row.map((c) => c.text)),
        { width: options.width },
      )}\n`;
    },
  };
};

// Decode HTML entities that marked escapes (we're outputting to terminal, not HTML)
const HTML_ENTITIES: Record<string, string> = {
  '&#39;': "'",
  '&amp;': '&',
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"',
};

const decodeHtmlEntities = (text: string): string =>
  text.replaceAll(/&#?\w+;/gu, (entity) => HTML_ENTITIES[entity] ?? entity);

const parseMarkdown = async (markdown: string, options: ParseOptions): Promise<string> => {
  const codeBlocks = new Map<string, { code: string; lang: string }>();

  const marked = new Marked();
  marked.use({ renderer: createRenderer(options, codeBlocks) });

  const parsed = marked.parse(markdown);
  let result = typeof parsed === 'string' ? parsed : await parsed;

  result = decodeHtmlEntities(result);

  if (codeBlocks.size > 0) {
    const codeConfig: CodeConfig = {
      continuation: options.continuation ?? '→',
      theme: theme().shikiTheme,
      width: options.width,
      wrap: options.wrap ?? true,
      ...(options.nerdFonts === undefined ? {} : { useNerdFonts: options.nerdFonts }),
    };

    const refs = [...codeBlocks.entries()].map(([id, { code, lang }]) => ({ code, id, lang }));

    const renderedById = await Effect.runPromise(
      renderCodeBlocksParallel(refs, codeConfig, theme().shikiTheme),
    );

    for (const [id, rendered] of renderedById) {
      result = result.replace(id, rendered);
    }
  }

  return result;
};

export { createRenderer, parseMarkdown };
