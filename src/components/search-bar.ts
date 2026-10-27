import { el } from './dom';
import { searchBookmarks } from '@/lib/search';
import type { Page } from '@/lib/types';
import { hostnameOf } from '@/utils/url';

/** Kept outside the component so the query survives re-renders (e.g. after a storage change). */
let currentQuery = '';

/**
 * Search box + results panel. While the query is not empty the results replace the columns.
 * Filtering runs on every keystroke and only touches the results panel (no full re-render).
 */
export function renderSearch(page: Page, columns: HTMLElement): { bar: HTMLElement; results: HTMLElement } {
  const input = el('input', {
    class: 'search-input',
    attrs: {
      type: 'search',
      placeholder: 'Search bookmarks…  (press /)',
      'aria-label': 'Search bookmarks',
      autocomplete: 'off',
    },
  });
  input.value = currentQuery;
  const results = el('section', { class: 'widget search-results', attrs: { 'aria-live': 'polite' } });

  const update = (): void => {
    currentQuery = input.value;
    const query = input.value.trim();
    results.hidden = query === '';
    columns.hidden = query !== '';
    if (query === '') return;

    const hits = searchBookmarks(page, query);
    if (hits.length === 0) {
      results.replaceChildren(el('p', { class: 'muted', text: `No bookmarks match “${query}”.` }));
      return;
    }
    results.replaceChildren(
      ...hits.map((hit) =>
        el('a', { class: 'hit', attrs: { href: hit.bookmark.url } }, [
          el('span', { class: 'ico', text: (hit.bookmark.title.trim()[0] ?? '?').toUpperCase() }),
          el('span', { class: 'hit-text' }, [
            el('span', { class: 'hit-title', text: hit.bookmark.title }),
            el('span', { class: 'hit-meta', text: `${hit.groupTitle} · ${hostnameOf(hit.bookmark.url)}` }),
          ]),
        ]),
      ),
    );
  };

  input.addEventListener('input', update);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      input.value = '';
      update();
    } else if (event.key === 'Enter') {
      results.querySelector<HTMLAnchorElement>('a.hit')?.click();
    }
  });
  update();

  return { bar: el('div', { class: 'search' }, [input]), results };
}

/** Pressing "/" focuses the search box (unless you are typing somewhere or a dialog is open). */
export function registerSearchShortcut(): void {
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if ((event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]')) return;
    if (document.querySelector('dialog[open]')) return;
    const input = document.querySelector<HTMLInputElement>('.search-input');
    if (!input) return;
    event.preventDefault();
    input.focus();
    input.select();
  });
}
