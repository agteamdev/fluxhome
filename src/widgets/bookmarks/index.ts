import { el } from '@/components/dom';
import { confirmDialog, openFormDialog } from '@/components/dialog';
import { widgetFrame } from '@/components/widget-frame';
import * as ops from '@/lib/page-ops';
import { updatePage } from '@/lib/page-store';
import type { Bookmark, Page, WidgetConfig } from '@/lib/types';
import { uid } from '@/utils/id';
import { hostnameOf, normalizeUrl } from '@/utils/url';
import {
  makeBookmarkDraggable,
  makeBookmarkListDropZone,
  makeGroupTabDraggable,
  makeGroupTabDropZone,
  makeTabListDropZone,
} from './dnd';

/** Remembers the selected group per widget while the page is re-rendered after edits. */
const activeGroupByWidget = new Map<string, string>();

function smallButton(text: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', { class: 'btn small', text, attrs: { type: 'button', title: label, 'aria-label': label } });
  button.addEventListener('click', onClick);
  return button;
}

/** Shows the add/edit form and resolves with a validated title + URL, or null if cancelled. */
async function askBookmark(
  heading: string,
  submitLabel: string,
  initial?: Pick<Bookmark, 'title' | 'url'>,
): Promise<{ title: string; url: string } | null> {
  const values = await openFormDialog({
    title: heading,
    submitLabel,
    fields: [
      { name: 'url', label: 'URL', value: initial?.url ?? '', placeholder: 'https://example.com', required: true },
      { name: 'title', label: 'Title', value: initial?.title ?? '', placeholder: 'Optional (defaults to the site name)' },
    ],
    validate: (v) => (normalizeUrl(v.url ?? '') ? null : 'Enter a valid http(s) URL'),
  });
  if (!values) return null;
  const url = normalizeUrl(values.url ?? '')!;
  return { url, title: values.title || hostnameOf(url) };
}

/** Bookmarks widget: groups as tabs, add/edit/delete, drag & drop. */
export function renderBookmarksWidget(widget: WidgetConfig, page: Page): HTMLElement {
  const addLink = smallButton('+ Link', 'Add a bookmark', () => void onAddBookmark());
  const addGroup = smallButton('+ Group', 'Add a group', () => void onAddGroup());
  const { root, body } = widgetFrame(widget, 'Bookmarks', [addLink, addGroup]);

  if (page.groups.length === 0) {
    addLink.disabled = true;
    body.append(el('p', { class: 'muted', text: 'No groups yet. Create one with “+ Group”.' }));
    return root;
  }

  let activeId = activeGroupByWidget.get(widget.id);
  if (!page.groups.some((g) => g.id === activeId)) activeId = page.groups[0]!.id;
  const activeGroup = page.groups.find((g) => g.id === activeId)!;
  activeGroupByWidget.set(widget.id, activeGroup.id);

  // ---- actions ----
  async function onAddGroup(): Promise<void> {
    const values = await openFormDialog({
      title: 'New group',
      submitLabel: 'Create',
      fields: [{ name: 'title', label: 'Group name', required: true }],
    });
    if (!values) return;
    const id = uid();
    activeGroupByWidget.set(widget.id, id);
    await updatePage(page.id, (p) => ops.addGroup(p, { id, title: values.title!, bookmarks: [] }));
  }

  async function onRenameGroup(): Promise<void> {
    const values = await openFormDialog({
      title: 'Rename group',
      submitLabel: 'Save',
      fields: [{ name: 'title', label: 'Group name', value: activeGroup.title, required: true }],
    });
    if (!values) return;
    await updatePage(page.id, (p) => ops.renameGroup(p, activeGroup.id, values.title!));
  }

  async function onDeleteGroup(): Promise<void> {
    if (activeGroup.bookmarks.length > 0) {
      const ok = await confirmDialog({
        title: 'Delete group?',
        message: `“${activeGroup.title}” and its ${activeGroup.bookmarks.length} bookmark(s) will be deleted.`,
        confirmLabel: 'Delete',
      });
      if (!ok) return;
    }
    await updatePage(page.id, (p) => ops.deleteGroup(p, activeGroup.id));
  }

  async function onAddBookmark(): Promise<void> {
    const data = await askBookmark('New bookmark', 'Add');
    if (!data) return;
    const bookmark: Bookmark = { id: uid(), createdAt: Date.now(), ...data };
    await updatePage(page.id, (p) => ops.addBookmark(p, activeGroup.id, bookmark));
  }

  async function onEditBookmark(bookmark: Bookmark): Promise<void> {
    const data = await askBookmark('Edit bookmark', 'Save', bookmark);
    if (!data) return;
    await updatePage(page.id, (p) => ops.updateBookmark(p, activeGroup.id, bookmark.id, data));
  }

  // ---- group tabs ----
  // The action buttons live outside the (wrapping) tab list, so they always stay in the top right corner
  const tabList = el('div', { class: 'tab-list', attrs: { role: 'tablist' } });
  for (const group of page.groups) {
    const isActive = group.id === activeGroup.id;
    // A <span>, not a <button>: Firefox cannot drag buttons
    const tab = el('span', {
      class: isActive ? 'tab active' : 'tab',
      text: group.title,
      attrs: { role: 'tab', tabindex: '0', 'aria-selected': String(isActive), 'data-group-id': group.id, title: 'Drag to reorder' },
    });
    const select = (): void => {
      activeGroupByWidget.set(widget.id, group.id);
      // Re-render this widget only; selection is UI state and is not persisted
      root.replaceWith(renderBookmarksWidget(widget, page));
    };
    tab.addEventListener('click', select);
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select();
      }
    });
    makeGroupTabDraggable(tab, group.id);
    makeGroupTabDropZone(tab, (payload) => {
      void updatePage(page.id, (p) => ops.moveBookmark(p, payload.groupId, payload.bookmarkId, group.id, null));
    });
    tabList.append(tab);
  }
  makeTabListDropZone(tabList, (groupId, beforeId) => {
    void updatePage(page.id, (p) => ops.moveGroup(p, groupId, beforeId));
  });

  const tabs = el('div', { class: 'tabs' }, [
    tabList,
    el('span', { class: 'tab-actions' }, [
      smallButton('✎', 'Rename group', () => void onRenameGroup()),
      smallButton('✕', 'Delete group', () => void onDeleteGroup()),
    ]),
  ]);

  // ---- bookmark list ----
  const list = el('ul', { class: 'links' });
  if (activeGroup.bookmarks.length === 0) {
    list.append(el('li', { class: 'muted empty', text: 'This group is empty' }));
  }
  for (const bookmark of activeGroup.bookmarks) {
    const letter = (bookmark.title.trim()[0] ?? '?').toUpperCase();
    const link = el('a', { attrs: { href: bookmark.url, title: bookmark.url, draggable: 'false' } }, [
      el('span', { class: 'ico', text: letter }),
      el('span', { class: 'link-title', text: bookmark.title }),
    ]);
    const row = el('li', { class: 'link-row', attrs: { 'data-bookmark-id': bookmark.id } }, [
      link,
      el('span', { class: 'row-actions' }, [
        smallButton('✎', 'Edit bookmark', () => void onEditBookmark(bookmark)),
        smallButton('✕', 'Delete bookmark', () => {
          void updatePage(page.id, (p) => ops.deleteBookmark(p, activeGroup.id, bookmark.id));
        }),
      ]),
    ]);
    makeBookmarkDraggable(row, { groupId: activeGroup.id, bookmarkId: bookmark.id });
    list.append(row);
  }
  makeBookmarkListDropZone(list, (payload, beforeId) => {
    void updatePage(page.id, (p) => ops.moveBookmark(p, payload.groupId, payload.bookmarkId, activeGroup.id, beforeId));
  });

  body.append(tabs, list);
  return root;
}
