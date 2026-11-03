import { describe, expect, it } from 'vitest';
import { parseIcs } from './ics';

const wrap = (...events: string[]) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\r\n');
const event = (...lines: string[]) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'].join('\r\n');

describe('parseIcs', () => {
  it('reads an all-day event', () => {
    const result = parseIcs(wrap(event('SUMMARY:Birthday', 'DTSTART;VALUE=DATE:20261030')));
    expect(result.events).toEqual([{ title: 'Birthday', date: '2026-10-30', repeat: 'none' }]);
  });
  it('reads a floating date-time', () => {
    const result = parseIcs(wrap(event('SUMMARY:Meeting', 'DTSTART:20261027T143000')));
    expect(result.events).toEqual([{ title: 'Meeting', date: '2026-10-27', time: '14:30', repeat: 'none' }]);
  });
  it('converts UTC times to local time', () => {
    const local = new Date(Date.UTC(2026, 9, 27, 12, 0));
    const pad = (n: number) => String(n).padStart(2, '0');
    const result = parseIcs(wrap(event('SUMMARY:Call', 'DTSTART:20261027T120000Z')));
    expect(result.events[0]!.date).toBe(`${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`);
    expect(result.events[0]!.time).toBe(`${pad(local.getHours())}:${pad(local.getMinutes())}`);
  });
  it('reads simple repeats and marks complex ones as simplified', () => {
    const simple = parseIcs(wrap(event('SUMMARY:A', 'DTSTART;VALUE=DATE:20260101', 'RRULE:FREQ=YEARLY')));
    expect(simple.events[0]!.repeat).toBe('yearly');
    expect(simple.simplified).toBe(0);
    const complex = parseIcs(wrap(event('SUMMARY:B', 'DTSTART;VALUE=DATE:20260101', 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=10')));
    expect(complex.events[0]!.repeat).toBe('none');
    expect(complex.simplified).toBe(1);
  });
  it('unfolds long lines and unescapes text', () => {
    const result = parseIcs('BEGIN:VEVENT\r\nSUMMARY:Lunch\\, with\r\n  Alex\r\nDTSTART;VALUE=DATE:20261030\r\nEND:VEVENT');
    expect(result.events[0]!.title).toBe('Lunch, with Alex');
  });
  it('skips events without a title or a valid date', () => {
    const result = parseIcs(wrap(event('DTSTART;VALUE=DATE:20261030'), event('SUMMARY:No date'), event('SUMMARY:Bad', 'DTSTART;VALUE=DATE:20261340')));
    expect(result.events).toEqual([]);
    expect(result.skipped).toBe(3);
  });
  it('respects the limit and ignores garbage', () => {
    const many = wrap(...Array.from({ length: 5 }, (_, i) => event(`SUMMARY:E${i}`, 'DTSTART;VALUE=DATE:20261030')));
    const result = parseIcs(many, 3);
    expect(result.events).toHaveLength(3);
    expect(result.skipped).toBe(2);
    expect(parseIcs('not a calendar').events).toEqual([]);
  });
});
