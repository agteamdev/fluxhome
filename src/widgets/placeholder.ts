import { el } from '@/components/dom';
import { widgetFrame } from '@/components/widget-frame';
import type { WidgetConfig } from '@/lib/types';

/** Placeholder for widgets that arrive in later stages. */
export function renderPlaceholder(widget: WidgetConfig, title: string, stage: string): HTMLElement {
  const { root, body } = widgetFrame(widget, title);
  body.append(el('p', { class: 'muted', text: `Coming in stage ${stage}` }));
  return root;
}
