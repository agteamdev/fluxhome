import { openFormDialog } from '@/components/dialog';
import { el } from '@/components/dom';
import { iconButton } from '@/components/icon-button';
import { locale, t } from '@/lib/i18n';
import type { CalendarEvent, Repeat } from '@/lib/types';
import { parseValue } from '@/utils/calendar';
import { timeSlots } from '@/utils/date';

export const REPEAT_OPTIONS = (): { value: Repeat; label: string }[] => [
  { value: 'none', label: t('cal.rep.none') },
  { value: 'daily', label: t('cal.rep.daily') },
  { value: 'weekly', label: t('cal.rep.weekly') },
  { value: 'monthly', label: t('cal.rep.monthly') },
  { value: 'yearly', label: t('cal.rep.yearly') },
];

/** "Tuesday, 27 October 2026" for a "YYYY-MM-DD" value. */
export function formatDayTitle(value: string): string {
  const parsed = parseValue(value);
  if (!parsed) return value;
  return new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString(locale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "27 Oct" for a "YYYY-MM-DD" value. */
export function formatDayShort(value: string): string {
  const parsed = parseValue(value);
  if (!parsed) return value;
  return new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

function timeOptions(current: string): { value: string; label: string }[] {
  const slots = timeSlots(15);
  if (current && !slots.includes(current)) slots.push(current);
  slots.sort();
  return [{ value: '', label: t('cal.allDay') }, ...slots.map((s) => ({ value: s, label: s }))];
}

/** Form for a new or an existing event. Resolves with the values to save, or null when cancelled. */
export async function askEvent(initial: CalendarEvent | null, date: string): Promise<Omit<CalendarEvent, 'id'> | null> {
  const values = await openFormDialog({
    title: initial ? t('cal.eventEdit') : t('cal.eventNew'),
    submitLabel: t('common.save'),
    fields: [
      { name: 'title', label: t('cal.eventTitle'), value: initial?.title ?? '', required: true },
      { name: 'date', label: t('cal.eventDate'), type: 'date', value: initial?.date ?? date, placeholder: t('common.noDate') },
      { name: 'time', label: t('cal.eventTime'), value: initial?.time ?? '', options: timeOptions(initial?.time ?? ''), searchable: true },
      { name: 'repeat', label: t('cal.repeat'), value: initial?.repeat ?? 'none', options: REPEAT_OPTIONS() },
    ],
    validate: (v) => (v.date ? null : t('cal.needDate')),
  });
  if (!values) return null;
  return {
    title: values.title!.slice(0, 200),
    date: values.date!,
    repeat: (values.repeat as Repeat) || 'none',
    ...(values.time ? { time: values.time } : {}),
  };
}

export type DayAction = { type: 'add' } | { type: 'edit'; event: CalendarEvent } | { type: 'delete'; event: CalendarEvent };

/** The events of one day. Resolves with what the user wants to do, or null when the dialog is just closed. */
export function askDay(date: string, events: CalendarEvent[]): Promise<DayAction | null> {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'dialog' });
    let result: DayAction | null = null;
    const finish = (action: DayAction): void => {
      result = action;
      dialog.close();
    };

    const list = el('ul', { class: 'day-events' });
    if (events.length === 0) list.append(el('li', { class: 'muted', text: t('cal.dayEmpty') }));
    for (const event of events) {
      list.append(
        el('li', { class: 'day-event' }, [
          el('span', { class: 'day-event-time', text: event.time ?? t('cal.allDay') }),
          el('span', { class: 'day-event-title', text: event.title }),
          event.repeat !== 'none' ? el('span', { class: 'day-event-repeat', text: REPEAT_OPTIONS().find((r) => r.value === event.repeat)?.label ?? '' }) : el('span'),
          el('span', { class: 'day-event-actions' }, [
            iconButton('edit', t('cal.editEvent'), () => finish({ type: 'edit', event })),
            iconButton('delete', t('cal.deleteEvent'), () => finish({ type: 'delete', event })),
          ]),
        ]),
      );
    }

    const close = el('button', { class: 'btn', text: t('common.close'), attrs: { type: 'button' } });
    const add = el('button', { class: 'btn primary', text: t('cal.add'), attrs: { type: 'button' } });
    close.addEventListener('click', () => dialog.close());
    add.addEventListener('click', () => finish({ type: 'add' }));
    dialog.append(
      el('div', { class: 'dialog-form' }, [
        el('h3', { class: 'dialog-title', text: formatDayTitle(date) }),
        list,
        el('div', { class: 'dialog-buttons' }, [close, add]),
      ]),
    );
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}
