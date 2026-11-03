import { describe, expect, it } from 'vitest';
import { daysWithEvents, eventOccursOn, eventsOnDate, updateEvent, upcoming } from './calendar-events';
import type { CalendarEvent } from './types';

const ev = (id: string, date: string, repeat: CalendarEvent['repeat'] = 'none', time?: string): CalendarEvent => ({
  id,
  title: id,
  date,
  repeat,
  ...(time ? { time } : {}),
});

describe('eventOccursOn', () => {
  it('a single event happens once', () => {
    expect(eventOccursOn(ev('a', '2026-10-27'), '2026-10-27')).toBe(true);
    expect(eventOccursOn(ev('a', '2026-10-27'), '2026-10-28')).toBe(false);
  });
  it('never happens before its first date', () => {
    expect(eventOccursOn(ev('a', '2026-10-27', 'daily'), '2026-10-26')).toBe(false);
  });
  it('daily and weekly', () => {
    expect(eventOccursOn(ev('a', '2026-10-27', 'daily'), '2027-03-01')).toBe(true);
    expect(eventOccursOn(ev('a', '2026-10-27', 'weekly'), '2026-11-03')).toBe(true);
    expect(eventOccursOn(ev('a', '2026-10-27', 'weekly'), '2026-11-04')).toBe(false);
  });
  it('monthly, also at the end of short months', () => {
    expect(eventOccursOn(ev('a', '2026-01-15', 'monthly'), '2026-07-15')).toBe(true);
    expect(eventOccursOn(ev('a', '2026-01-31', 'monthly'), '2026-02-28')).toBe(true);
    expect(eventOccursOn(ev('a', '2026-01-31', 'monthly'), '2026-02-27')).toBe(false);
    expect(eventOccursOn(ev('a', '2026-01-31', 'monthly'), '2026-04-30')).toBe(true);
  });
  it('yearly, also for 29 February', () => {
    expect(eventOccursOn(ev('a', '2020-05-09', 'yearly'), '2026-05-09')).toBe(true);
    expect(eventOccursOn(ev('a', '2020-05-09', 'yearly'), '2026-05-10')).toBe(false);
    expect(eventOccursOn(ev('a', '2024-02-29', 'yearly'), '2025-02-28')).toBe(true);
    expect(eventOccursOn(ev('a', '2024-02-29', 'yearly'), '2028-02-29')).toBe(true);
  });
  it('ignores invalid dates', () => {
    expect(eventOccursOn(ev('a', 'nonsense'), '2026-10-27')).toBe(false);
  });
});

describe('listings', () => {
  const events = [ev('late', '2026-10-27', 'none', '18:00'), ev('allday', '2026-10-27'), ev('early', '2026-10-27', 'none', '08:30'), ev('other', '2026-10-28')];
  it('sorts a day: all-day first, then by time', () => {
    expect(eventsOnDate(events, '2026-10-27').map((e) => e.id)).toEqual(['allday', 'early', 'late']);
  });
  it('finds the days of a month with events', () => {
    expect([...daysWithEvents(events, 2026, 9)].sort((a, b) => a - b)).toEqual([27, 28]);
    expect(daysWithEvents(events, 2026, 10).size).toBe(0);
  });
  it('lists upcoming occurrences in order', () => {
    const list = upcoming([...events, ev('birthday', '2000-10-30', 'yearly')], '2026-10-27', 60, 10);
    expect(list.map((o) => `${o.date} ${o.event.id}`)).toEqual([
      '2026-10-27 allday',
      '2026-10-27 early',
      '2026-10-27 late',
      '2026-10-28 other',
      '2026-10-30 birthday',
    ]);
  });
  it('respects the limit', () => {
    expect(upcoming([ev('d', '2026-10-27', 'daily')], '2026-10-27', 60, 3)).toHaveLength(3);
  });
  it('updates an event', () => {
    expect(updateEvent(events, 'other', { title: 'Changed', date: '2026-11-01', repeat: 'none' }).find((e) => e.id === 'other')!.title).toBe('Changed');
  });
});
