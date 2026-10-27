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
