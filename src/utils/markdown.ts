import { normalizeUrl } from './url';

/**
 * A tiny, safe Markdown parser. It produces a plain data tree (no HTML strings),
 * which components/markdown-view.ts turns into DOM nodes.
 *
 * Supported: # headings, paragraphs, - / 1. lists, ``` code blocks,
 * **bold**, *italic*, `code`, [links](https://...) (http/https only).
 */
export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; children: Inline[] }
  | { type: 'italic'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: Inline[] };

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'code'; text: string };

const TOKEN = /`([^`]+)`|\*\*(.+?)\*\*|\*([^*\s](?:[^*]*[^*\s])?)\*|\[([^\]]+)\]\(([^)\s]+)\)/;

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let rest = source;
  while (rest) {
    const match = TOKEN.exec(rest);
    if (!match) {
      out.push({ type: 'text', text: rest });
      break;
    }
    if (match.index > 0) out.push({ type: 'text', text: rest.slice(0, match.index) });

    if (match[1] !== undefined) {
      out.push({ type: 'code', text: match[1] });
    } else if (match[2] !== undefined) {
      out.push({ type: 'bold', children: parseInline(match[2]) });
    } else if (match[3] !== undefined) {
      out.push({ type: 'italic', children: parseInline(match[3]) });
    } else {
      const href = normalizeUrl(match[5]!);
      if (href) out.push({ type: 'link', href, children: parseInline(match[4]!) });
      // Unsafe or invalid link target: show the original text instead of a link
      else out.push({ type: 'text', text: match[0] });
    }
    rest = rest.slice(match.index + match[0].length);
  }
  return out;
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: Inline[][] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ type: 'paragraph', children: parseInline(paragraph.join('\n')) });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: 'list', ...list });
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.trimStart().startsWith('```')) {
      flushParagraph();
      flushList();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trimStart().startsWith('```')) code.push(lines[i++]!);
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: Math.min(3, heading[1]!.length) as 1 | 2 | 3, children: parseInline(heading[2]!) });
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      flushParagraph();
      const ordered = !bullet;
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push(parseInline(item[1]!));
      continue;
    }

    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}
