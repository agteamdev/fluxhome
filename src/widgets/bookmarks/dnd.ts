import { el } from '@/components/dom';

/** Custom MIME type so bookmark drags are never confused with widget or text drags. */
export const BOOKMARK_MIME = 'application/x-fluxhome-bookmark';

export interface BookmarkDragPayload {
  groupId: string;
  bookmarkId: string;
}

const hasType = (event: DragEvent): boolean =>
  event.dataTransfer ? Array.from(event.dataTransfer.types).includes(BOOKMARK_MIME) : false;

function readPayload(event: DragEvent): BookmarkDragPayload | null {
  const raw = event.dataTransfer?.getData(BOOKMARK_MIME);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<BookmarkDragPayload>;
    if (typeof data.groupId === 'string' && typeof data.bookmarkId === 'string') {
      return { groupId: data.groupId, bookmarkId: data.bookmarkId };
    }
  } catch {
    // Not our data: ignore
  }
  return null;
}

/** Makes one bookmark row draggable. */
export function makeBookmarkDraggable(row: HTMLElement, payload: BookmarkDragPayload): void {
  row.draggable = true;
  row.addEventListener('dragstart', (event) => {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData(BOOKMARK_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => row.classList.add('dragging'), 0);
  });
  row.addEventListener('dragend', () => row.classList.remove('dragging'));
}

/** Turns the bookmark list into a drop zone (reorder inside a group). */
export function makeBookmarkListDropZone(
  list: HTMLElement,
  onDrop: (payload: BookmarkDragPayload, beforeBookmarkId: string | null) => void,
): void {
  const indicator = el('li', { class: 'drop-indicator' });

  const findNext = (clientY: number): HTMLElement | null => {
    const rows = list.querySelectorAll<HTMLElement>(':scope > li[data-bookmark-id]:not(.dragging)');
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return row;
    }
    return null;
  };

  list.addEventListener('dragover', (event) => {
    if (!hasType(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    list.insertBefore(indicator, findNext(event.clientY));
  });

  list.addEventListener('dragleave', (event) => {
    if (!list.contains(event.relatedTarget as Node | null)) indicator.remove();
  });

  list.addEventListener('drop', (event) => {
    if (!hasType(event)) return;
    event.preventDefault();
    const before = findNext(event.clientY)?.dataset.bookmarkId ?? null;
    indicator.remove();
    const payload = readPayload(event);
    if (payload) onDrop(payload, before);
  });
}

/** Turns a group tab into a drop zone (move a bookmark to another group). */
export function makeGroupTabDropZone(tab: HTMLElement, onDrop: (payload: BookmarkDragPayload) => void): void {
  tab.addEventListener('dragover', (event) => {
    if (!hasType(event)) return;
    event.preventDefault();
    tab.classList.add('drop-hover');
  });
  tab.addEventListener('dragleave', () => tab.classList.remove('drop-hover'));
  tab.addEventListener('drop', (event) => {
    if (!hasType(event)) return;
    event.preventDefault();
    tab.classList.remove('drop-hover');
    const payload = readPayload(event);
    if (payload) onDrop(payload);
  });
}

/** Custom MIME type for dragging a group tab (reordering tabs). */
export const GROUP_MIME = 'application/x-fluxhome-group';

const hasGroupType = (event: DragEvent): boolean =>
  event.dataTransfer ? Array.from(event.dataTransfer.types).includes(GROUP_MIME) : false;

/** Makes a group tab draggable (it must not be a <button>: Firefox cannot drag buttons). */
export function makeGroupTabDraggable(tab: HTMLElement, groupId: string): void {
  tab.draggable = true;
  tab.addEventListener('dragstart', (event) => {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData(GROUP_MIME, groupId);
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => tab.classList.add('dragging'), 0);
  });
  tab.addEventListener('dragend', () => tab.classList.remove('dragging'));
}

/**
 * Turns the row of tabs into a drop zone for reordering.
 * `onDrop` receives the dragged group id and the id of the tab to insert before (null = end).
 */
export function makeTabListDropZone(list: HTMLElement, onDrop: (groupId: string, beforeGroupId: string | null) => void): void {
  const indicator = el('span', { class: 'tab-drop-indicator' });

  // Tabs can wrap onto several rows: a tab is "after the cursor" when the cursor is above its row,
  // or on its row and left of its middle.
  const findNext = (x: number, y: number): HTMLElement | null => {
    const tabs = list.querySelectorAll<HTMLElement>(':scope > .tab:not(.dragging)');
    for (const tab of tabs) {
      const rect = tab.getBoundingClientRect();
      if (y < rect.top || (y <= rect.bottom && x < rect.left + rect.width / 2)) return tab;
    }
    return null;
  };

  list.addEventListener('dragover', (event) => {
    if (!hasGroupType(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    list.insertBefore(indicator, findNext(event.clientX, event.clientY));
  });

  list.addEventListener('dragleave', (event) => {
    if (!list.contains(event.relatedTarget as Node | null)) indicator.remove();
  });

  list.addEventListener('drop', (event) => {
    if (!hasGroupType(event)) return;
    event.preventDefault();
    const groupId = event.dataTransfer?.getData(GROUP_MIME);
    const before = findNext(event.clientX, event.clientY)?.dataset.groupId ?? null;
    indicator.remove();
    if (groupId) onDrop(groupId, before);
  });
}
