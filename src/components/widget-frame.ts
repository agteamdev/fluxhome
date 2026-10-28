import { el } from './dom';
import { makeWidgetDraggable } from './widget-dnd';
import { t } from '@/lib/i18n';
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
    el('span', { class: 'grip', attrs: { 'aria-hidden': 'true', title: t('widget.drag') } }),
    el('h2', { class: 'widget-title', text: title }),
    el('div', { class: 'widget-actions' }, actions),
  ]);
  const body = el('div', { class: 'widget-body' });
  const root = el('section', { class: 'widget', attrs: { 'data-widget-id': widget.id } }, [header, body]);
  makeWidgetDraggable(header, root, widget.id);
  return { root, body };
}
