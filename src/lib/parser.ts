// src/lib/parser.ts
import { Marked } from 'marked';
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
  codeTheme?: string;
  nerdFonts?: boolean;
}

const codeBlocks = new Map<string, { code: string; lang: string }>();

export function createRenderer(options: ParseOptions) {
  return {
    blockquote({ text }: { text: string }) {
      return `${renderBlockquote(text.trim())}\n`;
    },

    code({ text, lang }: { text: string; lang?: string }) {
      const id = `__CODE_${Date.now()}_${Math.random().toString(36)}__`;
      codeBlocks.set(id, { code: text, lang: lang ?? '' });
      return id;
    },

    codespan({ text }: { text: string }) {
      return renderInlineCode(text);
    },

    em({ text }: { text: string }) {
      return `\x1b[3m${text}\x1b[23m`;
    },
    heading({ text, depth }: { text: string; depth: number }) {
      return renderHeading(text, depth, options.width);
    },

    hr() {
      return `\n${'─'.repeat(options.width)}\n\n`;
    },

    link({ href, text }: { href: string; text: string }) {
      return renderLink(text, href, { osc8: options.osc8 ?? 'auto', show_urls: false });
    },

    list({ items, ordered }: { items: Array<{ text: string }>; ordered: boolean }) {
      return `${items.map((item, i) => renderListItem(item.text, ordered, 0, i + 1)).join('\n')}\n`;
    },

    listitem({ text }: { text: string }) {
      return text;
    },

    paragraph({ text }: { text: string }) {
      return `${renderText(text, { hyphenation: options.hyphenation ?? true, width: options.width })}\n`;
    },

    strong({ text }: { text: string }) {
      return `\x1b[1m${text}\x1b[22m`;
    },

    table({
      header,
      rows
    }: {
      header: Array<{ text: string }>;
      rows: Array<Array<{ text: string }>>;
    }) {
      return `${renderTable(
        header.map((h) => h.text),
        rows.map((row) => row.map((c) => c.text))
      )}\n`;
    }
  };
}

export async function parseMarkdown(markdown: string, options: ParseOptions): Promise<string> {
  codeBlocks.clear();

  const marked = new Marked();
  marked.use({ renderer: createRenderer(options) });

  let result = marked.parse(markdown) as string;

  for (const [id, { code, lang }] of codeBlocks) {
    const rendered = await renderCodeBlock(code, lang, {
      continuation: '↪',
      theme: options.codeTheme ?? 'catppuccin-frappe',
      useNerdFonts: options.nerdFonts,
      width: options.width,
      wrap: options.wrap ?? true
    });
    result = result.replace(id, rendered);
  }

  codeBlocks.clear();
  return result;
}
