import type { Page, WidgetConfig } from '@/lib/types';
import { renderBookmarksWidget } from './bookmarks';
import { renderPlaceholder } from './placeholder';

/** Widget registry. A new widget means a new case in this switch. */
export function renderWidget(widget: WidgetConfig, page: Page): HTMLElement {
  switch (widget.type) {
    case 'bookmarks':
      return renderBookmarksWidget(page);
    case 'notes':
      return renderPlaceholder('Notes', '7');
    case 'todos':
      return renderPlaceholder('Todos', '7');
    case 'clock':
      return renderPlaceholder('Clock', '8');
    case 'search':
      return renderPlaceholder('Search', '8');
    case 'rss':
      return renderPlaceholder('News (RSS)', '9');
  }
}
