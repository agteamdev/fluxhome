import type { Note, Page, Todo, WidgetConfig } from '@/lib/types';
import { renderBookmarksWidget } from './bookmarks';
import { renderClockWidget } from './clock';
import { renderNotesWidget } from './notes';
import { renderTodosWidget } from './todos';

/** Everything a widget may need to render itself. */
export interface WidgetContext {
  page: Page;
  notes: Note[];
  todos: Todo[];
  siteIcons: boolean;
}

/** Widget registry. A new widget means a new case in this switch. */
export function renderWidget(widget: WidgetConfig, ctx: WidgetContext): HTMLElement {
  switch (widget.type) {
    case 'bookmarks':
      return renderBookmarksWidget(widget, ctx.page, ctx.siteIcons);
    case 'notes':
      return renderNotesWidget(widget, ctx.notes);
    case 'todos':
      return renderTodosWidget(widget, ctx.todos);
    case 'clock':
      return renderClockWidget(widget, ctx.page);
  }
}
