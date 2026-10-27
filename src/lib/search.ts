import type { Bookmark, Page } from './types';

export interface SearchHit {
  groupId: string;
  groupTitle: string;
  bookmark: Bookmark;
}

/**
 * Case-insensitive search over all bookmarks of a page.
 * Every word of the query must match somewhere in the title, URL, tags or group name.
 * Hits whose title matches more words come first; otherwise the page order is kept.
 */
export function searchBookmarks(page: Page, query: string): SearchHit[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: { hit: SearchHit; score: number }[] = [];
  for (const group of page.groups) {
    for (const bookmark of group.bookmarks) {
      const title = bookmark.title.toLowerCase();
      const haystack = [title, bookmark.url, group.title, ...(bookmark.tags ?? [])].join('\n').toLowerCase();
      if (!tokens.every((t) => haystack.includes(t))) continue;
      scored.push({
        hit: { groupId: group.id, groupTitle: group.title, bookmark },
        score: tokens.filter((t) => title.includes(t)).length,
      });
    }
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.hit);
}
