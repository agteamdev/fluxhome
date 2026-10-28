export interface PopupHandle {
  close(): void;
  /** Recalculate the position (call after the popup content changed size). */
  reposition(): void;
}

/**
 * Shows `popup` next to `anchor` (below it, or above when there is no room).
 * The popup is appended to the nearest <dialog> (so it stays visible above modal dialogs) or to <body>,
 * and uses fixed positioning, so it is never clipped by a widget or dialog.
 * It closes on outside click, Escape, resize and scrolling of the page.
 */
export function openPopup(anchor: HTMLElement, popup: HTMLElement, onClose: () => void): PopupHandle {
  const MARGIN = 8;
  const host: HTMLElement = anchor.closest('dialog') ?? document.body;
  popup.classList.add('popup-layer');
  host.append(popup);

  const place = (): void => {
    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;

    popup.style.minWidth = `${rect.width}px`;
    popup.style.maxHeight = '';
    const natural = popup.offsetHeight;
    const below = natural <= spaceBelow || spaceBelow >= spaceAbove;
    popup.style.maxHeight = `${Math.max(140, below ? spaceBelow : spaceAbove)}px`;

    const width = popup.offsetWidth;
    const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - MARGIN - width));
    popup.style.left = `${left}px`;
    popup.style.top = below ? `${rect.bottom + 4}px` : `${rect.top - popup.offsetHeight - 4}px`;
  };
  place();

  const onPointerDown = (event: PointerEvent): void => {
    const target = event.target as Node;
    if (!popup.contains(target) && !anchor.contains(target)) close();
  };
  const onScrollOrResize = (event: Event): void => {
    if (event.target instanceof Node && popup.contains(event.target)) return; // scrolling the list itself
    close();
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    // Close only the popup, not the dialog behind it
    event.preventDefault();
    event.stopPropagation();
    close();
    anchor.focus();
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('resize', onScrollOrResize);
  window.addEventListener('scroll', onScrollOrResize, true);

  let closed = false;
  function close(): void {
    if (closed) return;
    closed = true;
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('resize', onScrollOrResize);
    window.removeEventListener('scroll', onScrollOrResize, true);
    popup.remove();
    onClose();
  }

  return { close, reposition: place };
}
