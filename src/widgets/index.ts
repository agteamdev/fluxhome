import type { ActiveTracker, CalendarEvent, Countdown, Note, Page, TimeEntry, Todo, WidgetConfig } from '@/lib/types';
import { renderBookmarksWidget } from './bookmarks';
import { renderCalendarWidget } from './calendar';
import { renderClockWidget } from './clock';
import { renderNotesWidget } from './notes';
import { renderTimersWidget } from './timers';
import { renderWorkTimeWidget } from './worktime';
import { renderTodosWidget } from './todos';

/** Everything a widget may need to render itself. */
export interface WidgetContext {
  page: Page;
  notes: Note[];
  todos: Todo[];
  timeEntries: TimeEntry[];
  activeTracker: ActiveTracker | null;
  countdown: Countdown | null;
  events: CalendarEvent[];
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
    case 'timers':
      return renderTimersWidget(widget, ctx.page, ctx.countdown);
    case 'worktime':
      return renderWorkTimeWidget(widget, ctx.timeEntries, ctx.activeTracker);
    case 'calendar':
      return renderCalendarWidget(widget, ctx.events);
  }
}
