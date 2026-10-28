import { el } from './dom';
import { createSelect } from './select';
import { buildSearchUrl, parseEngine, SEARCH_ENGINES } from '@/lib/search-engines';
import { storage } from '@/lib/storage';
import { t } from '@/lib/i18n';
import type { Settings } from '@/lib/types';

/** Keeps the typed text when choosing an engine re-renders the page. */
let draft = '';

/**
 * Web search as one strip: an engine picker (icon only) followed by the search field.
 * The chosen engine is saved in the settings.
 */
export function renderWebSearchBar(settings: Settings): HTMLElement {
  const engineId = parseEngine(settings.searchEngine);
  const engine = SEARCH_ENGINES.find((e) => e.id === engineId)!;

  const input = el('input', {
    class: 'web-search-input',
    attrs: {
      type: 'search',
      placeholder: t('wsearch.placeholder', { engine: engine.name }),
      'aria-label': t('wsearch.label'),
      autocomplete: 'off',
    },
  });
  input.value = draft;
  input.addEventListener('input', () => {
    draft = input.value;
  });

  const picker = createSelect({
    items: SEARCH_ENGINES.map((e) => ({ value: e.id, label: e.name, badge: e.badge })),
    value: engineId,
    iconOnly: true,
    ariaLabel: t('wsearch.engine'),
    onChange: (id) => {
      void (async () => {
        const current = await storage.get('settings');
        if (current) await storage.set('settings', { ...current, searchEngine: id });
      })();
    },
  });
  picker.element.title = t('wsearch.engine');

  const form = el('form', { class: 'web-search', attrs: { role: 'search' } }, [picker.element, input]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const url = buildSearchUrl(engineId, input.value);
    if (!url) return;
    draft = '';
    window.location.href = url;
  });
  return form;
}
