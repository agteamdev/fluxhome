import { describe, expect, it } from 'vitest';
import {
  addBookmark,
  addGroup,
  deleteBookmark,
  deleteGroup,
  moveBookmark,
  moveWidget,
  renameGroup,
  updateBookmark,
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
