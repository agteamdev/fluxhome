import { bookmarkIcon } from '@/components/bookmark-icon';
import { el } from '@/components/dom';
import { confirmDialog, openFormDialog } from '@/components/dialog';
import { widgetFrame } from '@/components/widget-frame';
import { t } from '@/lib/i18n';
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
      { name: 'url', label: t('bm.url'), value: initial?.url ?? '', placeholder: 'https://example.com', required: true },
      { name: 'title', label: t('bm.titleLabel'), value: initial?.title ?? '', placeholder: t('bm.titleHint') },
    ],
    validate: (v) => (normalizeUrl(v.url ?? '') ? null : t('bm.invalidUrl')),
  });
  if (!values) return null;
  const url = normalizeUrl(values.url ?? '')!;
  return { url, title: values.title || hostnameOf(url) };
}

/** Bookmarks widget: groups as tabs, add/edit/delete, drag & drop. */
export function renderBookmarksWidget(widget: WidgetConfig, page: Page, siteIcons: boolean): HTMLElement {
  const addLink = smallButton(t('bm.addLink'), t('bm.addLinkTip'), () => void onAddBookmark());
  const addGroup = smallButton(t('bm.addGroup'), t('bm.addGroupTip'), () => void onAddGroup());
  const { root, body } = widgetFrame(widget, t('bm.title'), [addLink, addGroup]);

  if (page.groups.length === 0) {
    addLink.disabled = true;
    body.append(el('p', { class: 'muted', text: t('bm.noGroups') }));
    return root;
  }

  let activeId = activeGroupByWidget.get(widget.id);
  if (!page.groups.some((g) => g.id === activeId)) activeId = page.groups[0]!.id;
  const activeGroup = page.groups.find((g) => g.id === activeId)!;
  activeGroupByWidget.set(widget.id, activeGroup.id);

  // ---- actions ----
  async function onAddGroup(): Promise<void> {
    const values = await openFormDialog({
      title: t('bm.newGroup'),
      submitLabel: t('common.create'),
      fields: [{ name: 'title', label: t('bm.groupName'), required: true }],
    });
    if (!values) return;
    const id = uid();
    activeGroupByWidget.set(widget.id, id);
    await updatePage(page.id, (p) => ops.addGroup(p, { id, title: values.title!, bookmarks: [] }));
  }

  async function onRenameGroup(): Promise<void> {
    const values = await openFormDialog({
      title: t('bm.renameGroup'),
      submitLabel: t('common.save'),
      fields: [{ name: 'title', label: t('bm.groupName'), value: activeGroup.title, required: true }],
    });
    if (!values) return;
    await updatePage(page.id, (p) => ops.renameGroup(p, activeGroup.id, values.title!));
  }

  async function onDeleteGroup(): Promise<void> {
    if (activeGroup.bookmarks.length > 0) {
      const ok = await confirmDialog({
        title: t('bm.deleteGroupTitle'),
        message: t('bm.deleteGroupMessage', { title: activeGroup.title, count: activeGroup.bookmarks.length }),
        confirmLabel: t('common.delete'),
      });
      if (!ok) return;
    }
    await updatePage(page.id, (p) => ops.deleteGroup(p, activeGroup.id));
  }

  async function onAddBookmark(): Promise<void> {
    const data = await askBookmark(t('bm.newBookmark'), t('common.add'));
    if (!data) return;
    const bookmark: Bookmark = { id: uid(), createdAt: Date.now(), ...data };
    await updatePage(page.id, (p) => ops.addBookmark(p, activeGroup.id, bookmark));
  }

  async function onEditBookmark(bookmark: Bookmark): Promise<void> {
    const data = await askBookmark(t('bm.editBookmark'), t('common.save'), bookmark);
    if (!data) return;
    // A new address may have another icon: forget the old one
    await updatePage(page.id, (p) => {
      const updated = ops.updateBookmark(p, activeGroup.id, bookmark.id, data);
      return data.url !== bookmark.url ? ops.clearFavicon(updated, bookmark.id) : updated;
    });
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
      attrs: { role: 'tab', tabindex: '0', 'aria-selected': String(isActive), 'data-group-id': group.id, title: t('bm.dragTab') },
    });
    const select = (): void => {
      activeGroupByWidget.set(widget.id, group.id);
      // Re-render this widget only; selection is UI state and is not persisted
      root.replaceWith(renderBookmarksWidget(widget, page, siteIcons));
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
      smallButton('✎', t('bm.renameGroup'), () => void onRenameGroup()),
      smallButton('✕', t('bm.deleteGroup'), () => void onDeleteGroup()),
    ]),
  ]);

  // ---- bookmark list ----
  const list = el('ul', { class: 'links' });
  if (activeGroup.bookmarks.length === 0) {
    list.append(el('li', { class: 'muted empty', text: t('bm.empty') }));
  }
  for (const bookmark of activeGroup.bookmarks) {
    const link = el('a', { attrs: { href: bookmark.url, title: bookmark.url, draggable: 'false' } }, [
      bookmarkIcon(bookmark, siteIcons),
      el('span', { class: 'link-title', text: bookmark.title }),
    ]);
    const row = el('li', { class: 'link-row', attrs: { 'data-bookmark-id': bookmark.id } }, [
      link,
      el('span', { class: 'row-actions' }, [
        smallButton('✎', t('bm.editBookmark'), () => void onEditBookmark(bookmark)),
        smallButton('✕', t('bm.deleteBookmark'), () => {
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
