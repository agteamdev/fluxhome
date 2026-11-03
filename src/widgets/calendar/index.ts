import { el } from '@/components/dom';
import { iconButton } from '@/components/icon-button';
import { showToast } from '@/components/toast';
import { widgetFrame } from '@/components/widget-frame';
import { eventsOnDate, addEvent, deleteEvent, updateEvent, upcoming } from '@/lib/calendar-events';
import { locale, t } from '@/lib/i18n';
import { parseIcs } from '@/lib/ics';
import { updateEvents } from '@/lib/list-store';
import type { CalendarEvent, WidgetConfig } from '@/lib/types';
import { buildMonthGrid, cellValue, monthLabel, shiftMonth, weekdayLabels } from '@/utils/calendar';
import { formatDateInput } from '@/utils/date';
import { pickFile } from '@/utils/download';
import { uid } from '@/utils/id';
import { askDay, askEvent, formatDayShort } from './event-dialogs';

const MAX_EVENTS = 5000;
const MAX_ICS_BYTES = 5 * 1024 * 1024;
const UPCOMING_COUNT = 5;

/** The month shown by each calendar widget; kept while the page is redrawn after edits. */
const viewByWidget = new Map<string, { year: number; month: number }>();

function smallButton(text: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', { class: 'btn small', text, attrs: { type: 'button', title: label, 'aria-label': label } });
  button.addEventListener('click', onClick);
  return button;
}

/** Calendar widget: a month grid with your own events (stored only in the browser) and the next events. */
export function renderCalendarWidget(widget: WidgetConfig, events: CalendarEvent[]): HTMLElement {
  const today = new Date();
  const todayValue = formatDateInput(today.getTime());
  const view = viewByWidget.get(widget.id) ?? { year: today.getFullYear(), month: today.getMonth() };

  const addButton = smallButton(t('cal.add'), t('cal.addTip'), () => void onEvent(null, todayValue));
  const importButton = iconButton('import', t('cal.importIcs'), () => void onImport());
  const { root, body } = widgetFrame(widget, t('cal.title'), [addButton, importButton]);

  const show = (next: { year: number; month: number }): void => {
    viewByWidget.set(widget.id, next);
    root.replaceWith(renderCalendarWidget(widget, events));
  };

  // ---- month navigation ----
  const previous = el('button', { class: 'btn small', text: '‹', attrs: { type: 'button', 'aria-label': t('cal.prev'), title: t('cal.prev') } });
  const next = el('button', { class: 'btn small', text: '›', attrs: { type: 'button', 'aria-label': t('cal.next'), title: t('cal.next') } });
  const jump = el('button', { class: 'btn small', text: t('cal.today'), attrs: { type: 'button' } });
  previous.addEventListener('click', () => show(shiftMonth(view.year, view.month, -1)));
  next.addEventListener('click', () => show(shiftMonth(view.year, view.month, 1)));
  jump.addEventListener('click', () => show({ year: today.getFullYear(), month: today.getMonth() }));

  const head = el('div', { class: 'mini-head' }, [
    el('span', { class: 'mini-title', text: monthLabel(view.year, view.month, locale()) }),
    el('span', { class: 'mini-nav' }, [previous, jump, next]),
  ]);

  // ---- month grid ----
  const grid = el('div', { class: 'mini-grid' }, weekdayLabels(1, locale()).map((name) => el('span', { class: 'mini-weekday', text: name })));
  for (const cell of buildMonthGrid(view.year, view.month, 1)) {
    const value = cellValue(cell);
    const classes = ['mini-day'];
    if (!cell.inMonth) classes.push('out');
    if (value === todayValue) classes.push('today');
    if (eventsOnDate(events, value).length > 0) classes.push('has');
    const button = el('button', { class: classes.join(' '), text: String(cell.day), attrs: { type: 'button', 'data-value': value } });
    button.addEventListener('click', () => void onDay(value));
    grid.append(button);
  }

  // ---- next events ----
  const next5 = upcoming(events, todayValue, 90, UPCOMING_COUNT);
  const list = el('ul', { class: 'upcoming' });
  if (next5.length === 0) list.append(el('li', { class: 'muted', text: t('cal.noUpcoming') }));
  for (const { date, event } of next5) {
    const row = el('li', {}, [
      el('button', { class: 'upcoming-row', attrs: { type: 'button' } }, [
        el('span', { class: 'upcoming-date', text: date === todayValue ? t('cal.today') : formatDayShort(date) }),
        el('span', { class: 'upcoming-time', text: event.time ?? '' }),
        el('span', { class: 'upcoming-title', text: event.title }),
      ]),
    ]);
    row.querySelector('button')!.addEventListener('click', () => void onEvent(event, event.date));
    list.append(row);
  }

  body.append(head, grid, el('h3', { class: 'timer-heading', text: t('cal.upcoming') }), list);

  // ---------------------------------------------------------------- actions
  async function onEvent(initial: CalendarEvent | null, date: string): Promise<void> {
    const data = await askEvent(initial, date);
    if (!data) return;
    if (initial) await updateEvents((l) => updateEvent(l, initial.id, data));
    else if (events.length < MAX_EVENTS) await updateEvents((l) => addEvent(l, { id: uid(), ...data }));
  }

  async function onDay(value: string): Promise<void> {
    const action = await askDay(value, eventsOnDate(events, value));
    if (!action) return;
    if (action.type === 'add') await onEvent(null, value);
    else if (action.type === 'edit') await onEvent(action.event, action.event.date);
    else await updateEvents((l) => deleteEvent(l, action.event.id));
  }

  async function onImport(): Promise<void> {
    const file = await pickFile('.ics,text/calendar');
    if (!file) return;
    if (file.size > MAX_ICS_BYTES) return showToast(t('cal.icsTooLarge'), 'error');

    const parsed = parseIcs(await file.text());
    if (parsed.events.length === 0) return showToast(t('cal.icsEmpty'), 'error');

    // Importing the same file twice must not duplicate events
    const key = (e: Omit<CalendarEvent, 'id'>): string => `${e.title}|${e.date}|${e.time ?? ''}|${e.repeat}`;
    let added = 0;
    await updateEvents((list) => {
      const known = new Set(list.map(key));
      const fresh = parsed.events.filter((e) => !known.has(key(e))).slice(0, Math.max(0, MAX_EVENTS - list.length));
      added = fresh.length;
      return [...list, ...fresh.map((e) => ({ id: uid(), ...e }))];
    });
    showToast(parsed.simplified > 0 ? t('cal.importedSimplified', { count: added, simplified: parsed.simplified }) : t('cal.imported', { count: added }));
  }

  return root;
}
