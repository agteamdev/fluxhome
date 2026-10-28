import type { Bookmark, BookmarkGroup, Page, WidgetConfig, WidgetType } from './types';
import { normalizeUrl } from '@/utils/url';

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

const urlKey = (url: string): string => (normalizeUrl(url) ?? url).replace(/\/$/, '');

/** Finds an existing bookmark with the same URL (ignores a trailing slash). */
export function findBookmarkByUrl(page: Page, url: string): { group: BookmarkGroup; bookmark: Bookmark } | null {
  const key = urlKey(url);
  for (const group of page.groups) {
    const bookmark = group.bookmarks.find((b) => urlKey(b.url) === key);
    if (bookmark) return { group, bookmark };
  }
  return null;
}

/** Merges new values into the props of one widget. */
export function updateWidgetProps(page: Page, widgetId: string, props: Record<string, unknown>): Page {
  return { ...page, widgets: page.widgets.map((w) => (w.id === widgetId ? { ...w, props: { ...w.props, ...props } } : w)) };
}

/** Adds a widget at the end of the least filled visible column (the first one on a tie). */
export function addWidget(page: Page, type: WidgetType, id: string, columnLimit = page.columns.length): Page {
  const columns = page.columns.slice(0, Math.max(1, columnLimit));
  if (columns.length === 0) return page;
  const counts = columns.map((c) => page.widgets.filter((w) => w.columnId === c.id).length);
  const index = counts.indexOf(Math.min(...counts));
  const widget: WidgetConfig = { id, type, columnId: columns[index]!.id, order: counts[index]!, props: {} };
  return { ...page, widgets: [...page.widgets, widget] };
}

export function removeWidgetsOfType(page: Page, type: WidgetType): Page {
  return { ...page, widgets: page.widgets.filter((w) => w.type !== type) };
}

/** Makes the page show exactly the wanted widget types (one widget per type). */
export function applyWidgetSelection(
  page: Page,
  wanted: WidgetType[],
  columnLimit: number,
  newId: () => string,
): Page {
  const all: WidgetType[] = ['bookmarks', 'clock', 'notes', 'todos'];
  let result = page;
  for (const type of all) {
    const present = result.widgets.some((w) => w.type === type);
    const want = wanted.includes(type);
    if (present && !want) result = removeWidgetsOfType(result, type);
    else if (!present && want) result = addWidget(result, type, newId(), columnLimit);
  }
  return result;
}

/**
 * Moves a group (tab) to another position.
 * `beforeGroupId` is the group it is inserted in front of; null means "to the end".
 */
export function moveGroup(page: Page, groupId: string, beforeGroupId: string | null): Page {
  const moved = page.groups.find((g) => g.id === groupId);
  if (!moved) return page;
  const rest = page.groups.filter((g) => g.id !== groupId);
  const index = beforeGroupId === null ? -1 : rest.findIndex((g) => g.id === beforeGroupId);
  rest.splice(index === -1 ? rest.length : index, 0, moved);
  return { ...page, groups: rest };
}

/**
 * Makes the page have exactly `count` columns.
 * New columns get an equal share of the width; widgets of removed columns move to the least filled
 * remaining column (keeping their order).
 */
export function setColumnCount(page: Page, count: number, newId: () => string): Page {
  const target = Math.max(1, Math.floor(count));
  if (page.columns.length === target) return page;

  if (page.columns.length < target) {
    const added = Array.from({ length: target - page.columns.length }, () => ({
      id: newId(),
      width: { value: 1, unit: '%' as const },
    }));
    return { ...page, columns: [...page.columns, ...added] };
  }

  const kept = page.columns.slice(0, target);
  const keptIds = new Set(kept.map((c) => c.id));
  const columnIndex = new Map(page.columns.map((c, i) => [c.id, i]));
  const widgets = page.widgets.filter((w) => keptIds.has(w.columnId));
  const displaced = page.widgets
    .filter((w) => !keptIds.has(w.columnId))
    .sort((a, b) => (columnIndex.get(a.columnId) ?? 0) - (columnIndex.get(b.columnId) ?? 0) || a.order - b.order);

  for (const widget of displaced) {
    const counts = kept.map((c) => widgets.filter((w) => w.columnId === c.id).length);
    const index = counts.indexOf(Math.min(...counts));
    widgets.push({ ...widget, columnId: kept[index]!.id, order: counts[index]! });
  }
  return { ...page, columns: kept, widgets };
}

/** Adds a bookmark to the first group; creates a group when the page has none (used by the context menu). */
export function addBookmarkToFirstGroup(page: Page, bookmark: Bookmark, newGroupId: string, newGroupTitle: string): Page {
  const first = page.groups[0];
  if (!first) return { ...page, groups: [{ id: newGroupId, title: newGroupTitle, bookmarks: [bookmark] }] };
  return addBookmark(page, first.id, bookmark);
}

/** Stores downloaded site icons (by bookmark id). An empty string marks "no icon found". */
export function setFavicons(page: Page, icons: Record<string, string>): Page {
  return {
    ...page,
    groups: page.groups.map((g) => ({
      ...g,
      bookmarks: g.bookmarks.map((b) => (icons[b.id] !== undefined ? { ...b, favicon: icons[b.id] } : b)),
    })),
  };
}

/** Forgets "no icon found" markers so those bookmarks are tried again. */
export function clearFailedFavicons(page: Page): Page {
  return {
    ...page,
    groups: page.groups.map((g) => ({
      ...g,
      bookmarks: g.bookmarks.map((b) => {
        if (b.favicon !== '') return b;
        const copy = { ...b };
        delete copy.favicon;
        return copy;
      }),
    })),
  };
}

/** Removes the stored icon of one bookmark so it is downloaded again (used when its address changed). */
export function clearFavicon(page: Page, bookmarkId: string): Page {
  return {
    ...page,
    groups: page.groups.map((g) => ({
      ...g,
      bookmarks: g.bookmarks.map((b) => {
        if (b.id !== bookmarkId || b.favicon === undefined) return b;
        const copy = { ...b };
        delete copy.favicon;
        return copy;
      }),
    })),
  };
}
