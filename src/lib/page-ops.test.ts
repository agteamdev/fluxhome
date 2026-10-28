import { describe, expect, it } from 'vitest';
import {
  addBookmark,
  addBookmarkToFirstGroup,
  clearFailedFavicons,
  clearFavicon,
  setFavicons,
  addWidget,
  applyWidgetSelection,
  addGroup,
  deleteBookmark,
  deleteGroup,
  findBookmarkByUrl,
  moveBookmark,
  moveGroup,
  moveWidget,
  renameGroup,
  setColumnCount,
  updateBookmark,
  updateWidgetProps,
} from './page-ops';
import type { Page } from './types';

const bm = (id: string) => ({ id, title: id, url: `https://${id}.test/`, createdAt: 0 });

function makePage(): Page {
  return {
    id: 'p',
    title: 'Home',
    groups: [
      { id: 'g1', title: 'One', bookmarks: [bm('a'), bm('b'), bm('c')] },
      { id: 'g2', title: 'Two', bookmarks: [bm('d')] },
    ],
    columns: [
      { id: 'c1', width: { value: 1, unit: '%' } },
      { id: 'c2', width: { value: 1, unit: '%' } },
    ],
    widgets: [
      { id: 'w1', type: 'bookmarks', columnId: 'c1', order: 0, props: {} },
      { id: 'w2', type: 'notes', columnId: 'c1', order: 1, props: {} },
      { id: 'w3', type: 'todos', columnId: 'c2', order: 0, props: {} },
    ],
  };
}

const ids = (page: Page, groupId: string) => page.groups.find((g) => g.id === groupId)!.bookmarks.map((b) => b.id);

describe('groups', () => {
  it('adds, renames and deletes a group', () => {
    let page = addGroup(makePage(), { id: 'g3', title: 'Three', bookmarks: [] });
    expect(page.groups).toHaveLength(3);
    page = renameGroup(page, 'g3', 'Renamed');
    expect(page.groups[2]!.title).toBe('Renamed');
    page = deleteGroup(page, 'g3');
    expect(page.groups).toHaveLength(2);
  });
});

describe('bookmarks', () => {
  it('adds, updates and deletes a bookmark', () => {
    let page = addBookmark(makePage(), 'g2', bm('e'));
    expect(ids(page, 'g2')).toEqual(['d', 'e']);
    page = updateBookmark(page, 'g2', 'e', { title: 'New' });
    expect(page.groups[1]!.bookmarks[1]!.title).toBe('New');
    page = deleteBookmark(page, 'g2', 'e');
    expect(ids(page, 'g2')).toEqual(['d']);
  });

  it('reorders inside a group', () => {
    const page = moveBookmark(makePage(), 'g1', 'c', 'g1', 'a');
    expect(ids(page, 'g1')).toEqual(['c', 'a', 'b']);
  });

  it('moves to the end of another group', () => {
    const page = moveBookmark(makePage(), 'g1', 'a', 'g2', null);
    expect(ids(page, 'g1')).toEqual(['b', 'c']);
    expect(ids(page, 'g2')).toEqual(['d', 'a']);
  });

  it('moves in front of a bookmark of another group', () => {
    const page = moveBookmark(makePage(), 'g1', 'a', 'g2', 'd');
    expect(ids(page, 'g2')).toEqual(['a', 'd']);
  });

  it('ignores unknown ids', () => {
    const page = makePage();
    expect(moveBookmark(page, 'g1', 'nope', 'g2', null)).toBe(page);
  });
});

describe('moveWidget', () => {
  it('moves a widget to another column and renumbers order', () => {
    const page = moveWidget(makePage(), 'w1', 'c2', 'w3');
    const col = (id: string) =>
      page.widgets
        .filter((w) => w.columnId === id)
        .sort((a, b) => a.order - b.order)
        .map((w) => w.id);
    expect(col('c1')).toEqual(['w2']);
    expect(col('c2')).toEqual(['w1', 'w3']);
    expect(page.widgets.find((w) => w.id === 'w2')!.order).toBe(0);
  });

  it('keeps the widget count', () => {
    expect(moveWidget(makePage(), 'w2', 'c2', null).widgets).toHaveLength(3);
  });

  it('ignores an unknown column', () => {
    const page = makePage();
    expect(moveWidget(page, 'w1', 'missing', null)).toBe(page);
  });
});

describe('findBookmarkByUrl', () => {
  it('finds a bookmark ignoring a trailing slash', () => {
    const found = findBookmarkByUrl(makePage(), 'https://d.test');
    expect(found?.bookmark.id).toBe('d');
    expect(found?.group.id).toBe('g2');
  });
  it('returns null when there is no match', () => {
    expect(findBookmarkByUrl(makePage(), 'https://nope.test/')).toBeNull();
  });
});

describe('widget visibility', () => {
  it('merges props into one widget', () => {
    const page = updateWidgetProps(makePage(), 'w1', { a: 1 });
    expect(page.widgets.find((w) => w.id === 'w1')!.props).toEqual({ a: 1 });
    expect(page.widgets.find((w) => w.id === 'w2')!.props).toEqual({});
  });

  it('adds a widget to the least filled column', () => {
    const page = addWidget(makePage(), 'clock', 'new');
    const added = page.widgets.find((w) => w.id === 'new')!;
    expect(added.columnId).toBe('c2'); // c1 has 2 widgets, c2 has 1
    expect(added.order).toBe(1);
  });

  it('respects the visible column limit', () => {
    const page = addWidget(makePage(), 'clock', 'new', 1);
    expect(page.widgets.find((w) => w.id === 'new')!.columnId).toBe('c1');
  });

  it('applies a selection of widget types', () => {
    let n = 0;
    const page = applyWidgetSelection(makePage(), ['bookmarks', 'clock', 'notes'], 2, () => `id${++n}`);
    const types = page.widgets.map((w) => w.type).sort();
    expect(types).toEqual(['bookmarks', 'clock', 'notes']);
  });
});

describe('moveGroup', () => {
  const order = (page: Page) => page.groups.map((g) => g.id);
  it('moves a group in front of another', () => {
    const page = addGroup(makePage(), { id: 'g3', title: 'Three', bookmarks: [] });
    expect(order(moveGroup(page, 'g3', 'g1'))).toEqual(['g3', 'g1', 'g2']);
  });
  it('moves a group to the end', () => {
    expect(order(moveGroup(makePage(), 'g1', null))).toEqual(['g2', 'g1']);
  });
  it('ignores unknown groups', () => {
    const page = makePage();
    expect(moveGroup(page, 'nope', null)).toBe(page);
  });
});

describe('setColumnCount', () => {
  it('adds columns', () => {
    let n = 0;
    const page = setColumnCount(makePage(), 4, () => `new${++n}`);
    expect(page.columns.map((c) => c.id)).toEqual(['c1', 'c2', 'new1', 'new2']);
    expect(page.widgets).toHaveLength(3);
  });
  it('removes columns and moves their widgets to the least filled column', () => {
    const page = setColumnCount(makePage(), 1, () => 'x');
    expect(page.columns.map((c) => c.id)).toEqual(['c1']);
    expect(page.widgets).toHaveLength(3);
    expect(page.widgets.every((w) => w.columnId === 'c1')).toBe(true);
    expect(page.widgets.map((w) => w.order).sort()).toEqual([0, 1, 2]);
  });
  it('spreads displaced widgets over the remaining columns', () => {
    let n = 0;
    let page = setColumnCount(makePage(), 3, () => `n${++n}`); // columns c1, c2, n1
    page = { ...page, widgets: [...page.widgets, { id: 'w4', type: 'clock', columnId: 'n1', order: 0, props: {} }] };
    const result = setColumnCount(page, 2, () => 'x');
    const count = (id: string) => result.widgets.filter((w) => w.columnId === id).length;
    expect(count('c1') + count('c2')).toBe(4);
    expect(count('c2')).toBe(2); // c2 had 1 widget, c1 had 2: the moved one goes to c2
  });
  it('does nothing when the count matches', () => {
    const page = makePage();
    expect(setColumnCount(page, 2, () => 'x')).toBe(page);
  });
});

describe('context menu and icons', () => {
  it('adds to the first group', () => {
    const page = addBookmarkToFirstGroup(makePage(), bm('x'), 'ng', 'Saved');
    expect(ids(page, 'g1')).toEqual(['a', 'b', 'c', 'x']);
  });
  it('creates a group when the page has none', () => {
    const empty = { ...makePage(), groups: [] };
    const page = addBookmarkToFirstGroup(empty, bm('x'), 'ng', 'Saved');
    expect(page.groups).toHaveLength(1);
    expect(page.groups[0]).toEqual({ id: 'ng', title: 'Saved', bookmarks: [bm('x')] });
  });
  it('stores icons and forgets failed markers', () => {
    let page = setFavicons(makePage(), { a: 'data:image/png;base64,AA', b: '' });
    expect(page.groups[0]!.bookmarks[0]!.favicon).toBe('data:image/png;base64,AA');
    expect(page.groups[0]!.bookmarks[1]!.favicon).toBe('');
    expect(page.groups[0]!.bookmarks[2]!.favicon).toBe(undefined);
    page = clearFailedFavicons(page);
    expect(page.groups[0]!.bookmarks[0]!.favicon).toBe('data:image/png;base64,AA');
    expect(page.groups[0]!.bookmarks[1]!.favicon).toBe(undefined);
  });
});

describe('clearFavicon', () => {
  it('removes the icon of one bookmark only', () => {
    const page = setFavicons(makePage(), { a: 'data:image/png;base64,AA', b: 'data:image/png;base64,BB' });
    const cleared = clearFavicon(page, 'a');
    expect(cleared.groups[0]!.bookmarks[0]!.favicon).toBe(undefined);
    expect(cleared.groups[0]!.bookmarks[1]!.favicon).toBe('data:image/png;base64,BB');
  });
});
