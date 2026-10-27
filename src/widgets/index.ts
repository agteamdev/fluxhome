import type { Page, WidgetConfig } from '@/lib/types';
import { renderBookmarksWidget } from './bookmarks';
import { renderPlaceholder } from './placeholder';

/** Widget registry. A new widget means a new case in this switch. */
export function renderWidget(widget: WidgetConfig, page: Page): HTMLElement {
  switch (widget.type) {
    case 'bookmarks':
      return renderBookmarksWidget(widget, page);
    case 'notes':
      return renderPlaceholder(widget, 'Notes', '7');
    case 'todos':
      return renderPlaceholder(widget, 'Todos', '7');
    case 'clock':
      return renderPlaceholder(widget, 'Clock', '8');
    case 'search':
      return renderPlaceholder(widget, 'Search', '8');
    case 'rss':
      return renderPlaceholder(widget, 'News (RSS)', '9');
  }
}
