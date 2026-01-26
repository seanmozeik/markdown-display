// src/lib/parser.ts
import { Marked, type Token } from 'marked';
import { theme } from '../ui/themes';
import { getBoldStyle, getItalicStyle } from '../ui/themes/semantic';
import { renderBlockquote } from './elements/blockquote';
import { renderCodeBlock, renderInlineCode } from './elements/code';
import { renderHeading } from './elements/heading';
import { renderLink } from './elements/link';
import { renderListItem } from './elements/list';
import { renderTable } from './elements/table';
import { renderText } from './elements/text';

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
  parser: {
    parse(tokens: Token[]): string;
    parseInline(tokens: Token[]): string;
  };
}

export function createRenderer(
  options: ParseOptions,
  codeBlocks: Map<string, { code: string; lang: string }>
) {
  function renderListWithDepth(
    parser: RendererThis['parser'],
    items: Array<{ tokens: Token[]; task?: boolean; checked?: boolean }>,
    ordered: boolean,
    start: number,
    depth: number
  ): string {
    // Inline token types that can be passed to parseInline
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
      'checkbox'
    ]);

    return items
      .map((item, i) => {
        // Separate tokens by type:
        // - Inline tokens: can be parsed with parseInline
        // - Paragraph: unwrap to get inner inline tokens
        // - Code: handle specially for deferred syntax highlighting
        // - List: handle recursively for nesting
        // - Other block tokens (blockquote, table, heading, hr, html): render with parse()
        const inlineTokens: Token[] = [];
        const nestedLists: Array<{
          items: Array<{ tokens: Token[]; task?: boolean; checked?: boolean }>;
          ordered: boolean;
          start?: number;
        }> = [];
        const blockContent: Token[] = [];

        for (const t of item.tokens) {
          if (t.type === 'list') {
            nestedLists.push(t as (typeof nestedLists)[number]);
          } else if (t.type === 'code') {
            // Code blocks - store for deferred syntax highlighting
            const codeToken = t as { text: string; lang?: string };
            const id = `__CODE_${Date.now()}_${Math.random().toString(36)}__`;
            codeBlocks.set(id, { code: codeToken.text, lang: codeToken.lang ?? '' });
            blockContent.push({ raw: id, text: id, type: 'html' } as Token);
          } else if (t.type === 'paragraph' && 'tokens' in t) {
            // Paragraph wraps inline content in loose lists - extract inner tokens
            inlineTokens.push(...(t.tokens as Token[]));
          } else if (t.type === 'space') {
            // Whitespace between block content - skip
          } else if (INLINE_TYPES.has(t.type)) {
            // Known inline token
            inlineTokens.push(t);
          } else {
            // Other block tokens (blockquote, table, heading, hr, html)
            blockContent.push(t);
          }
        }

        // Render the item's inline content
        const text = parser.parseInline(inlineTokens);
        const renderedItem = renderListItem(text, ordered, depth, start + i, {
          checked: item.checked,
          hyphenation: options.hyphenation,
          nerdFonts: options.nerdFonts,
          task: item.task,
          width: options.width
        });

        // Render any block content (tables, blockquotes, code blocks, etc.)
        const blockRendered = blockContent.length > 0 ? parser.parse(blockContent).trim() : '';

        // Recursively render nested lists
        const nestedRendered = nestedLists
          .map((nested) =>
            renderListWithDepth(parser, nested.items, nested.ordered, nested.start ?? 1, depth + 1)
          )
          .join('\n');

        // Join: item text, then block content, then nested lists
        const parts = [renderedItem];
        if (blockRendered) parts.push(blockRendered);
        if (nestedRendered) parts.push(nestedRendered);
        return parts.join('\n');
      })
      .join('\n');
  }

  return {
    blockquote(this: RendererThis, { tokens }: { tokens: Token[] }): string {
      // Blockquotes contain block-level tokens (paragraphs, lists, etc.), not inline
      const text = this.parser.parse(tokens);
      return `${renderBlockquote(text.trim(), { hyphenation: options.hyphenation, width: options.width })}\n\n`;
    },

    checkbox(): string {
      // Return empty - we render checkboxes in renderListItem based on task/checked flags
      return '';
    },

    code({ text, lang }: { text: string; lang?: string }): string {
      const id = `__CODE_${Date.now()}_${Math.random().toString(36)}__`;
      codeBlocks.set(id, { code: text, lang: lang ?? '' });
      return id;
    },

    codespan({ text }: { text: string }): string {
      return renderInlineCode(text);
    },

    em({ text }: { text: string }): string {
      return getItalicStyle()(text);
    },

    heading(this: RendererThis, { tokens, depth }: { tokens: Token[]; depth: number }): string {
      const text = this.parser.parseInline(tokens);
      return renderHeading(text, depth, options.width);
    },

    hr(): string {
      return `\n${'─'.repeat(options.width)}\n\n`;
    },

    link(this: RendererThis, { href, tokens }: { href: string; tokens: Token[] }): string {
      const text = this.parser.parseInline(tokens);
      return renderLink(text, href, { osc8: options.osc8 ?? 'auto', show_urls: false });
    },

    list(
      this: RendererThis,
      {
        items,
        ordered,
        start
      }: {
        items: Array<{ tokens: Token[]; task?: boolean; checked?: boolean }>;
        ordered: boolean;
        start: number | '';
      }
    ): string {
      return `${renderListWithDepth(this.parser, items, ordered, start || 1, 0)}\n`;
    },

    listitem(this: RendererThis, { tokens }: { tokens: Token[] }): string {
      return this.parser.parseInline(tokens);
    },

    paragraph(this: RendererThis, { tokens }: { tokens: Token[] }): string {
      const text = this.parser.parseInline(tokens);
      return `${renderText(text, { hyphenation: options.hyphenation ?? true, width: options.width })}\n`;
    },

    strong({ text }: { text: string }): string {
      return getBoldStyle()(text);
    },

    table({
      header,
      rows
    }: {
      header: Array<{ text: string }>;
      rows: Array<Array<{ text: string }>>;
    }): string {
      return `${renderTable(
        header.map((h) => h.text),
        rows.map((row) => row.map((c) => c.text)),
        { width: options.width }
      )}\n`;
    }
  };
}

// Decode HTML entities that marked escapes (we're outputting to terminal, not HTML)
const HTML_ENTITIES: Record<string, string> = {
  '&#39;': "'",
  '&amp;': '&',
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"'
};

function decodeHtmlEntities(text: string): string {
  return text.replace(/&#?\w+;/g, (entity) => HTML_ENTITIES[entity] ?? entity);
}

export async function parseMarkdown(markdown: string, options: ParseOptions): Promise<string> {
  const codeBlocks = new Map<string, { code: string; lang: string }>();

  const marked = new Marked();
  marked.use({ renderer: createRenderer(options, codeBlocks) });

  let result = marked.parse(markdown) as string;

  // Decode HTML entities since we're outputting to terminal, not HTML
  result = decodeHtmlEntities(result);

  for (const [id, { code, lang }] of codeBlocks) {
    const rendered = await renderCodeBlock(code, lang, {
      continuation: options.continuation ?? '→',
      theme: theme().shikiTheme,
      useNerdFonts: options.nerdFonts,
      width: options.width,
      wrap: options.wrap ?? true
    });
    result = result.replace(id, rendered);
  }

  return result;
}
