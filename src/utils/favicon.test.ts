import { describe, expect, it } from 'vitest';
import { parseIconLinks } from './favicon';

const base = 'https://example.com/blog/post';

describe('parseIconLinks', () => {
  it('finds icons and resolves relative addresses', () => {
    const html = '<head><link rel="icon" href="/img/fav.png"><link rel="stylesheet" href="/a.css"></head>';
    expect(parseIconLinks(html, base)).toEqual(['https://example.com/img/fav.png']);
  });
  it('prefers the size closest to 32 and ranks apple-touch-icons lower', () => {
    const html = `
      <link rel="apple-touch-icon" sizes="180x180" href="/apple.png">
      <link rel="icon" sizes="16x16" href="/16.png">
      <link rel="shortcut icon" sizes="32x32" href="/32.png">
      <link rel="icon" sizes="192x192" href="/192.png">`;
    expect(parseIconLinks(html, base)).toEqual([
      'https://example.com/32.png',
      'https://example.com/16.png',
      'https://example.com/192.png',
      'https://example.com/apple.png',
    ]);
  });
  it('handles single quotes and unquoted attributes', () => {
    expect(parseIconLinks("<link rel='icon' href='/a.ico'>", base)).toEqual(['https://example.com/a.ico']);
    expect(parseIconLinks('<link rel=icon href=/b.ico>', base)).toEqual(['https://example.com/b.ico']);
  });
  it('ignores unsafe schemes and data-href look-alikes', () => {
    expect(parseIconLinks('<link rel="icon" href="javascript:alert(1)">', base)).toEqual([]);
    expect(parseIconLinks('<link rel="icon" data-href="/x.png">', base)).toEqual([]);
    expect(parseIconLinks('<link rel="icon" href="data:image/png;base64,AAA">', base)).toEqual([]);
  });
  it('removes duplicates and returns nothing for pages without icons', () => {
    const html = '<link rel="icon" href="/a.png"><link rel="shortcut icon" href="/a.png">';
    expect(parseIconLinks(html, base)).toEqual(['https://example.com/a.png']);
    expect(parseIconLinks('<html></html>', base)).toEqual([]);
  });
});
