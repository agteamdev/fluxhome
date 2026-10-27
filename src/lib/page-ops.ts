import type { Bookmark, BookmarkGroup, Page, WidgetConfig } from './types';

/**
 * Pure functions that take a Page and return a new Page.
 * They never touch storage or the DOM, so they are easy to unit test.
 */

function mapGroup(page: Page, groupId: string, fn: (group: BookmarkGroup) => BookmarkGroup): Page {
  return { ...page, groups: page.groups.map((g) => (g.id === groupId ? fn(g) : g)) };
}

export function addGroup(page: Page, group: BookmarkGroup): Page {
  return { ...page, groups: [...page.groups, group] };
}

export function renameGroup(page: Page, groupId: string, title: string): Page {
  return mapGroup(page, groupId, (g) => ({ ...g, title }));
}

export function deleteGroup(page: Page, groupId: string): Page {
  return { ...page, groups: page.groups.filter((g) => g.id !== groupId) };
}

export function addBookmark(page: Page, groupId: string, bookmark: Bookmark): Page {
  return mapGroup(page, groupId, (g) => ({ ...g, bookmarks: [...g.bookmarks, bookmark] }));
}

export function updateBookmark(
  page: Page,
  groupId: string,
  bookmarkId: string,
  changes: Partial<Pick<Bookmark, 'title' | 'url'>>,
): Page {
  return mapGroup(page, groupId, (g) => ({
    ...g,
    bookmarks: g.bookmarks.map((b) => (b.id === bookmarkId ? { ...b, ...changes } : b)),
  }));
}

export function deleteBookmark(page: Page, groupId: string, bookmarkId: string): Page {
  return mapGroup(page, groupId, (g) => ({ ...g, bookmarks: g.bookmarks.filter((b) => b.id !== bookmarkId) }));
}

/**
 * Moves a bookmark to another position or group.
 * `beforeBookmarkId` is the bookmark the moved one is inserted in front of
 * (looked up after the moved bookmark is removed); null means "to the end".
 */
export function moveBookmark(
  page: Page,
  fromGroupId: string,
  bookmarkId: string,
  toGroupId: string,
  beforeBookmarkId: string | null,
): Page {
  const moved = page.groups.find((g) => g.id === fromGroupId)?.bookmarks.find((b) => b.id === bookmarkId);
  if (!moved || !page.groups.some((g) => g.id === toGroupId)) return page;

  const groups = page.groups
    .map((g) => (g.id === fromGroupId ? { ...g, bookmarks: g.bookmarks.filter((b) => b.id !== bookmarkId) } : g))
    .map((g) => {
      if (g.id !== toGroupId) return g;
      const list = [...g.bookmarks];
      const index = beforeBookmarkId === null ? -1 : list.findIndex((b) => b.id === beforeBookmarkId);
      list.splice(index === -1 ? list.length : index, 0, moved);
      return { ...g, bookmarks: list };
    });

  return { ...page, groups };
}

/**
 * Moves a widget to a column/position and renumbers `order` in every column.
 * `beforeWidgetId` works like in moveBookmark.
 */
export function moveWidget(page: Page, widgetId: string, toColumnId: string, beforeWidgetId: string | null): Page {
  const moved = page.widgets.find((w) => w.id === widgetId);
  if (!moved || !page.columns.some((c) => c.id === toColumnId)) return page;

  const rest = page.widgets.filter((w) => w.id !== widgetId);
  const result: WidgetConfig[] = [];

  for (const column of page.columns) {
    const list = rest.filter((w) => w.columnId === column.id).sort((a, b) => a.order - b.order);
    if (column.id === toColumnId) {
      const index = beforeWidgetId === null ? -1 : list.findIndex((w) => w.id === beforeWidgetId);
      list.splice(index === -1 ? list.length : index, 0, { ...moved, columnId: toColumnId });
    }
    list.forEach((w, i) => result.push({ ...w, columnId: column.id, order: i }));
  }

  // Keep widgets that belong to unknown columns untouched
  const known = new Set(page.columns.map((c) => c.id));
  for (const w of rest) if (!known.has(w.columnId)) result.push(w);

  return { ...page, widgets: result };
}
