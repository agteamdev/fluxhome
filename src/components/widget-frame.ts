import { el } from './dom';
import { makeWidgetDraggable } from './widget-dnd';
import type { WidgetConfig } from '@/lib/types';

/**
 * Common frame for every widget: a draggable header (title + action buttons) and a body.
 * Widgets render their content into `body`.
 */
export function widgetFrame(
  widget: WidgetConfig,
  title: string,
  actions: HTMLElement[] = [],
): { root: HTMLElement; body: HTMLElement } {
  const header = el('div', { class: 'widget-header' }, [
    el('span', { class: 'grip', text: '⋮⋮', attrs: { 'aria-hidden': 'true', title: 'Drag to move' } }),
    el('h2', { class: 'widget-title', text: title }),
    el('div', { class: 'widget-actions' }, actions),
  ]);
  const body = el('div', { class: 'widget-body' });
  const root = el('section', { class: 'widget', attrs: { 'data-widget-id': widget.id } }, [header, body]);
  makeWidgetDraggable(header, root, widget.id);
  return { root, body };
}
