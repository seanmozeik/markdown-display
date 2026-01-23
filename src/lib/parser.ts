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

const codeBlocks = new Map<string, { code: string; lang: string }>();

export function createRenderer(options: ParseOptions) {
  return {
    blockquote(this: RendererThis, { tokens }: { tokens: Token[] }): string {
      // Blockquotes contain block-level tokens (paragraphs, lists, etc.), not inline
      const text = this.parser.parse(tokens);
      return `${renderBlockquote(text.trim(), { hyphenation: options.hyphenation, width: options.width })}\n\n`;
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
      { items, ordered }: { items: Array<{ tokens: Token[] }>; ordered: boolean }
    ): string {
      return `${items
        .map((item, i) => {
          const text = this.parser.parseInline(item.tokens);
          return renderListItem(text, ordered, 0, i + 1, {
            hyphenation: options.hyphenation,
            width: options.width
          });
        })
        .join('\n')}\n`;
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
        rows.map((row) => row.map((c) => c.text))
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
  codeBlocks.clear();

  const marked = new Marked();
  marked.use({ renderer: createRenderer(options) });

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

  codeBlocks.clear();
  return result;
}
