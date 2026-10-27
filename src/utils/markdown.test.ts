import { describe, expect, it } from 'vitest';
import { parseInline, parseMarkdown } from './markdown';

describe('parseInline', () => {
  it('parses bold, italic and code', () => {
    expect(parseInline('a **b** *c* `d`')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'bold', children: [{ type: 'text', text: 'b' }] },
      { type: 'text', text: ' ' },
      { type: 'italic', children: [{ type: 'text', text: 'c' }] },
      { type: 'text', text: ' ' },
      { type: 'code', text: 'd' },
    ]);
  });
  it('parses safe links', () => {
    expect(parseInline('[site](https://example.com)')).toEqual([
      { type: 'link', href: 'https://example.com/', children: [{ type: 'text', text: 'site' }] },
    ]);
  });
  it('never creates links for unsafe targets', () => {
    expect(parseInline('[x](javascript:alert(1))')).toEqual([{ type: 'text', text: '[x](javascript:alert(1)' }, { type: 'text', text: ')' }]);
    expect(parseInline('[x](data:text/html,hi)').some((n) => n.type === 'link')).toBe(false);
  });
  it('keeps plain text as is', () => {
    expect(parseInline('2 * 3 = 6')).toEqual([{ type: 'text', text: '2 * 3 = 6' }]);
  });
});

describe('parseMarkdown', () => {
  it('parses headings and paragraphs', () => {
    const blocks = parseMarkdown('# Title\n\nHello\nworld');
    expect(blocks).toEqual([
      { type: 'heading', level: 1, children: [{ type: 'text', text: 'Title' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'Hello\nworld' }] },
    ]);
  });
  it('caps heading level at 3', () => {
    expect((parseMarkdown('###### deep')[0] as { level: number }).level).toBe(3);
  });
  it('groups list items and separates ordered from unordered', () => {
    const blocks = parseMarkdown('- a\n- b\n1. c');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      type: 'list',
      ordered: false,
      items: [[{ type: 'text', text: 'a' }], [{ type: 'text', text: 'b' }]],
    });
    expect((blocks[1] as { ordered: boolean }).ordered).toBe(true);
  });
  it('parses fenced code blocks without touching their content', () => {
    expect(parseMarkdown('```\n**not bold**\n```')).toEqual([{ type: 'code', text: '**not bold**' }]);
  });
  it('handles an unclosed code fence', () => {
    expect(parseMarkdown('```\nabc')).toEqual([{ type: 'code', text: 'abc' }]);
  });
  it('returns nothing for empty input', () => {
    expect(parseMarkdown('')).toEqual([]);
  });
});
