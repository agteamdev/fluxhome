import { el } from '@/components/dom';
import { widgetFrame } from '@/components/widget-frame';
import * as ops from '@/lib/page-ops';
import { updatePage } from '@/lib/page-store';
import { buildSearchUrl, parseEngine, SEARCH_ENGINES } from '@/lib/search-engines';
import type { Page, WidgetConfig } from '@/lib/types';

/** Keeps the typed text when changing the engine re-renders the page. */
const drafts = new Map<string, string>();

/** Web search widget: one input, a choice of search engine (Brave by default). */
export function renderSearchWidget(widget: WidgetConfig, page: Page): HTMLElement {
  const { root, body } = widgetFrame(widget, 'Web search');

  const input = el('input', {
    class: 'web-search-input',
    attrs: { type: 'search', placeholder: 'Search the web…', autocomplete: 'off', 'aria-label': 'Search the web' },
  });
  input.value = drafts.get(widget.id) ?? '';

  const select = el('select', { attrs: { 'aria-label': 'Search engine' } });
  for (const engine of SEARCH_ENGINES) {
    select.append(el('option', { text: engine.name, attrs: { value: engine.id } }));
  }
  select.value = parseEngine(widget.props.engine);

  const button = el('button', { class: 'btn primary small', text: 'Search', attrs: { type: 'submit' } });
  const form = el('form', { class: 'web-search' }, [input, select, button]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const url = buildSearchUrl(parseEngine(select.value), input.value);
    if (!url) return;
    drafts.delete(widget.id);
    window.location.href = url;
  });

  select.addEventListener('change', () => {
    drafts.set(widget.id, input.value);
    void updatePage(page.id, (p) => ops.updateWidgetProps(p, widget.id, { engine: select.value }));
  });

  body.append(form);
  return root;
}
