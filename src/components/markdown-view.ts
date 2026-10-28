import { el } from './dom';
import { t } from '@/lib/i18n';
import { parseMarkdown, type Block, type Inline } from '@/utils/markdown';

function renderInline(nodes: Inline[]): Node[] {
  return nodes.map((node): Node => {
    switch (node.type) {
      case 'text':
        return document.createTextNode(node.text);
      case 'bold':
        return el('strong', {}, renderInline(node.children));
      case 'italic':
        return el('em', {}, renderInline(node.children));
      case 'code':
        return el('code', { text: node.text });
      case 'link':
        return el('a', { attrs: { href: node.href, rel: 'noopener noreferrer' } }, renderInline(node.children));
    }
  });
}

function renderBlock(block: Block): HTMLElement {
  switch (block.type) {
    case 'heading':
      return el(block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5', {}, renderInline(block.children));
    case 'paragraph':
      return el('p', {}, renderInline(block.children));
    case 'list':
      return el(
        block.ordered ? 'ol' : 'ul',
        {},
        block.items.map((item) => el('li', {}, renderInline(item))),
      );
    case 'code':
      return el('pre', {}, [el('code', { text: block.text })]);
  }
}

/** Renders Markdown text as DOM (built from a parsed tree, never from HTML strings). */
export function renderMarkdown(source: string): HTMLElement {
  const root = el('div', { class: 'markdown' });
  const blocks = parseMarkdown(source);
  if (blocks.length === 0) root.append(el('p', { class: 'muted', text: t('md.empty') }));
  for (const block of blocks) root.append(renderBlock(block));
  return root;
}
