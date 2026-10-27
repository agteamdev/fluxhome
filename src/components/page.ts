import { el } from './dom';
import { renderWidget, type WidgetContext } from '@/widgets';
import { renderBackupButtons } from './backup-actions';
import { renderSearch } from './search-bar';
import { renderWidgetsButton } from './widgets-dialog';
import { makeColumnDropZone } from './widget-dnd';
import { moveWidget } from '@/lib/page-ops';
import { updatePage } from '@/lib/page-store';
import { getGreeting } from '@/utils/greeting';
import type { Page, Settings, StorageSchema } from '@/lib/types';

function applySettings(settings: Settings): void {
  document.documentElement.dataset.theme = settings.theme;

  const { type, value } = settings.background;
  const s = document.body.style;
  s.backgroundColor = '';
  s.backgroundImage = '';
  if (!value) return;
  if (type === 'solid') s.backgroundColor = value;
  if (type === 'gradient') s.backgroundImage = value;
  if (type === 'image') {
    s.backgroundImage = `url("${value.replace(/"/g, '%22')}")`;
    s.backgroundSize = 'cover';
    s.backgroundPosition = 'center';
  }
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
    root.append(el('p', { class: 'muted', text: 'No pages found. Reset the extension data.' }));
    return;
  }

  const greeting = config.settings.showGreeting
    ? getGreeting(new Date(), config.settings.userName, config.settings.greetingByTime)
    : '';
  const columns = renderColumns(page, config.settings.columnsCount, { page, notes: config.notes, todos: config.todos });
  const search = renderSearch(page, columns);
  const headerItems: HTMLElement[] = [];
  if (greeting) headerItems.push(el('h1', { text: greeting }));
  headerItems.push(search.bar, renderBackupButtons([renderWidgetsButton(page, config.settings.columnsCount)]));
  root.append(el('header', { class: 'header' }, headerItems), search.results, columns);
}
