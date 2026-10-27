import { el } from '@/components/dom';

/** Placeholder for widgets that arrive in later stages. */
export function renderPlaceholder(title: string, stage: string): HTMLElement {
  return el('section', { class: 'widget' }, [
    el('h2', { class: 'widget-title', text: title }),
    el('p', { class: 'muted', text: `Coming in stage ${stage}` }),
  ]);
}
