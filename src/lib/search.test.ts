import { describe, expect, it } from 'vitest';
import { searchBookmarks } from './search';
import type { Page } from './types';

const bm = (id: string, title: string, url: string, tags?: string[]) => ({
  id,
  title,
  url,
  createdAt: 0,
  ...(tags ? { tags } : {}),
});

const page: Page = {
  id: 'p',
  title: 'Home',
  columns: [],
  widgets: [],
  groups: [
    { id: 'g1', title: 'Dev', bookmarks: [bm('1', 'GitHub', 'https://github.com/'), bm('2', 'MDN Web Docs', 'https://developer.mozilla.org/', ['docs'])] },
    { id: 'g2', title: 'News', bookmarks: [bm('3', 'Hacker News', 'https://news.ycombinator.com/'), bm('4', 'Dev.to', 'https://dev.to/')] },
  ],
};

const ids = (q: string) => searchBookmarks(page, q).map((h) => h.bookmark.id);

describe('searchBookmarks', () => {
  it('returns nothing for an empty query', () => {
    expect(ids('')).toEqual([]);
    expect(ids('   ')).toEqual([]);
  });
  it('is case-insensitive and matches the title', () => {
    expect(ids('GITHUB')).toEqual(['1']);
  });
  it('matches the URL', () => {
    expect(ids('ycombinator')).toEqual(['3']);
  });
  it('matches tags and group names', () => {
    expect(ids('docs')).toEqual(['2']);
    expect(ids('news')).toEqual(['3', '4']);
  });
  it('requires every word to match', () => {
    expect(ids('hacker news')).toEqual(['3']);
    expect(ids('hacker github')).toEqual([]);
  });
  it('puts title matches first', () => {
    // "dev" is in the title of bookmark 4 and only in the group name or URL of 1 and 2 (page order)
    expect(ids('dev')).toEqual(['4', '1', '2']);
  });
  it('reports the group of each hit', () => {
    expect(searchBookmarks(page, 'github')[0]!.groupTitle).toBe('Dev');
  });
});
