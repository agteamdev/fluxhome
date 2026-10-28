import { el } from './dom';
import { renderWidget, type WidgetContext } from '@/widgets';
import { renderSearch } from './search-bar';
import { renderSettingsButton } from './settings-dialog';
import { renderWebSearchBar } from './web-search-bar';
import { t } from '@/lib/i18n';
import { makeColumnDropZone } from './widget-dnd';
import { moveWidget } from '@/lib/page-ops';
import { updatePage } from '@/lib/page-store';
import { getGreeting } from '@/utils/greeting';
import type { Page, Settings, StorageSchema } from '@/lib/types';

function applySettings(settings: Settings): void {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.style.setProperty('--card-alpha', String(settings.cardOpacity));

  const { type, value } = settings.background;
  const s = document.body.style;
  s.backgroundColor = '';
  s.backgroundImage = '';
  s.backgroundSize = '';
  s.backgroundPosition = '';
  s.backgroundAttachment = '';
  document.body.classList.toggle('has-background', value !== '');
  if (!value) return;

  if (type === 'solid') {
    s.backgroundColor = value;
    return;
  }
  s.backgroundImage = type === 'image' ? `url("${value.replace(/"/g, '%22')}")` : value;
  s.backgroundSize = 'cover';
  s.backgroundPosition = 'center';
  s.backgroundAttachment = 'fixed';
}

function renderColumns(page: Page, columnsCount: number, ctx: WidgetContext): HTMLElement {
  const columns = page.columns.slice(0, columnsCount);
  const wrap = el('div', { class: 'columns' });
  // '%' is treated as a proportion (fr), 'px' as a fixed width
  wrap.style.gridTemplateColumns = columns
    .map((c) => (c.width.unit === 'px' ? `${c.width.value}px` : `minmax(0, ${c.width.value}fr)`))
    .join(' ');

  for (const col of columns) {
    const colEl = el('div', { class: 'column', attrs: { 'data-column-id': col.id } });
    const widgets = page.widgets.filter((w) => w.columnId === col.id).sort((a, b) => a.order - b.order);
    for (const w of widgets) colEl.append(renderWidget(w, ctx));
    makeColumnDropZone(colEl, (widgetId, beforeId) => {
      void updatePage(page.id, (p) => moveWidget(p, widgetId, col.id, beforeId));
    });
    wrap.append(colEl);
  }
  return wrap;
}

/** Renders the whole new tab page. */
export function renderPage(root: HTMLElement, config: StorageSchema): void {
  applySettings(config.settings);
  root.replaceChildren();

  const page = config.pages.find((p) => p.id === config.activePageId) ?? config.pages[0];
  if (!page) {
    root.append(el('p', { class: 'muted', text: t('app.noPages') }));
    return;
  }

  const greeting = config.settings.showGreeting
    ? getGreeting(new Date(), config.settings.userName, config.settings.greetingByTime)
    : '';
  const columns = renderColumns(page, config.settings.columnsCount, { page, notes: config.notes, todos: config.todos, siteIcons: config.settings.siteIcons });
  const search = renderSearch(page, columns, config.settings.siteIcons);
  const headerItems: HTMLElement[] = [];
  if (greeting) headerItems.push(el('h1', { text: greeting }));
  headerItems.push(search.bar);
  if (config.settings.showWebSearch) headerItems.push(renderWebSearchBar(config.settings));
  headerItems.push(el('div', { class: 'header-actions' }, [renderSettingsButton(config.settings, page)]));
  root.append(el('header', { class: 'header' }, headerItems), search.results, columns);
}
