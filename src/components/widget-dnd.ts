import { el } from './dom';

/** Custom MIME type so widget drags are never confused with bookmark or text drags. */
export const WIDGET_MIME = 'application/x-fluxhome-widget';

const hasType = (event: DragEvent, mime: string): boolean =>
  event.dataTransfer ? Array.from(event.dataTransfer.types).includes(mime) : false;

/** Makes `handle` start dragging the whole widget element. */
export function makeWidgetDraggable(handle: HTMLElement, widgetEl: HTMLElement, widgetId: string): void {
  handle.draggable = true;
  handle.addEventListener('dragstart', (event) => {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData(WIDGET_MIME, widgetId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setDragImage(widgetEl, 20, 20);
    // Delay so the drag image is captured before the widget is dimmed
    setTimeout(() => widgetEl.classList.add('dragging'), 0);
  });
  handle.addEventListener('dragend', () => widgetEl.classList.remove('dragging'));
}

/**
 * Turns a column element into a drop zone for widgets.
 * `onDrop` receives the widget id and the id of the widget to insert before (null = end).
 */
export function makeColumnDropZone(
  column: HTMLElement,
  onDrop: (widgetId: string, beforeWidgetId: string | null) => void,
): void {
  const indicator = el('div', { class: 'drop-indicator' });

  const findNext = (clientY: number): HTMLElement | null => {
    const widgets = column.querySelectorAll<HTMLElement>(':scope > .widget:not(.dragging)');
    for (const widget of widgets) {
      const rect = widget.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return widget;
    }
    return null;
  };

  column.addEventListener('dragover', (event) => {
    if (!hasType(event, WIDGET_MIME)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    column.insertBefore(indicator, findNext(event.clientY));
  });

  column.addEventListener('dragleave', (event) => {
    if (!column.contains(event.relatedTarget as Node | null)) indicator.remove();
  });

  column.addEventListener('drop', (event) => {
    if (!hasType(event, WIDGET_MIME)) return;
    event.preventDefault();
    const widgetId = event.dataTransfer?.getData(WIDGET_MIME);
    const before = findNext(event.clientY)?.dataset.widgetId ?? null;
    indicator.remove();
    if (widgetId) onDrop(widgetId, before);
  });
}
