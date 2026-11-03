import type { CalendarEvent } from './types';
import { parseValue } from '@/utils/calendar';

/** Pure functions for the calendar events (no storage, no DOM). Dates are "YYYY-MM-DD" strings. */

const DAY_MS = 86_400_000;
const dayNumber = (year: number, month: number, day: number): number => Date.UTC(year, month, day) / DAY_MS;
const daysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();

/** Does the event happen on this day? Repeating events start on their own date and go on forever. */
export function eventOccursOn(event: CalendarEvent, value: string): boolean {
  const first = parseValue(event.date);
  const target = parseValue(value);
  if (!first || !target) return false;

  const diff = dayNumber(target.year, target.month, target.day) - dayNumber(first.year, first.month, first.day);
  if (diff < 0) return false;

  switch (event.repeat) {
    case 'none':
      return diff === 0;
    case 'daily':
      return true;
    case 'weekly':
      return diff % 7 === 0;
    case 'monthly':
      // The 31st falls on the last day of shorter months
      return target.day === Math.min(first.day, daysInMonth(target.year, target.month));
    case 'yearly':
      // 29 February falls on 28 February in years without it
      return target.month === first.month && target.day === Math.min(first.day, daysInMonth(target.year, target.month));
  }
}

const sortKey = (e: CalendarEvent): string => `${e.time ?? '00:00'}|${e.time ? '1' : '0'}|${e.title.toLowerCase()}`;

/** Events of one day: all-day events first, then by time. */
export function eventsOnDate(events: CalendarEvent[], value: string): CalendarEvent[] {
  return events
    .filter((e) => eventOccursOn(e, value))
    .sort((a, b) => (a.time ? 1 : 0) - (b.time ? 1 : 0) || sortKey(a).localeCompare(sortKey(b)));
}

/** The days of a month (1-31) that have at least one event. */
export function daysWithEvents(events: CalendarEvent[], year: number, month: number): Set<number> {
  const days = new Set<number>();
  const pad = (n: number) => String(n).padStart(2, '0');
  for (let day = 1; day <= daysInMonth(year, month); day++) {
    const value = `${year}-${pad(month + 1)}-${pad(day)}`;
    if (events.some((e) => eventOccursOn(e, value))) days.add(day);
  }
  return days;
}

export interface Occurrence {
  date: string;
  event: CalendarEvent;
}

/** The next occurrences from `fromValue` (included) within `days` days, in chronological order. */
export function upcoming(events: CalendarEvent[], fromValue: string, days = 60, limit = 6): Occurrence[] {
  const start = parseValue(fromValue);
  if (!start) return [];
  const result: Occurrence[] = [];
  const pad = (n: number) => String(n).padStart(2, '0');
  for (let offset = 0; offset < days && result.length < limit; offset++) {
    const d = new Date(start.year, start.month, start.day + offset);
    const value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    for (const event of eventsOnDate(events, value)) {
      if (result.length < limit) result.push({ date: value, event });
    }
  }
  return result;
}

export const addEvent = (events: CalendarEvent[], event: CalendarEvent): CalendarEvent[] => [...events, event];
export const deleteEvent = (events: CalendarEvent[], id: string): CalendarEvent[] => events.filter((e) => e.id !== id);
export const updateEvent = (events: CalendarEvent[], id: string, changes: Omit<CalendarEvent, 'id'>): CalendarEvent[] =>
  events.map((e) => (e.id === id ? { id, ...changes } : e));
