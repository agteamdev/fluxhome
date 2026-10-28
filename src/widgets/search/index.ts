import { el } from '@/components/dom';
import { createSelect } from '@/components/select';
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

  const select = createSelect({
    items: SEARCH_ENGINES.map((e) => ({ value: e.id, label: e.name })),
    value: parseEngine(widget.props.engine),
    ariaLabel: 'Search engine',
    onChange: (engine) => {
      drafts.set(widget.id, input.value);
      void updatePage(page.id, (p) => ops.updateWidgetProps(p, widget.id, { engine }));
    },
  });

  const button = el('button', { class: 'btn primary small', text: 'Search', attrs: { type: 'submit' } });
  const form = el('form', { class: 'web-search' }, [input, select.element, button]);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const url = buildSearchUrl(parseEngine(select.value), input.value);
    if (!url) return;
    drafts.delete(widget.id);
    window.location.href = url;
  });

  body.append(form);
  return root;
}
