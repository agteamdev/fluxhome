import { describe, expect, it } from 'vitest';
import {
  combineDeadline,
  formatDateInput,
  formatDeadline,
  formatTimeInput,
  parseDateInput,
  parseTimeInput,
  startOfDay,
  timeSlots,
} from './date';

describe('date helpers', () => {
  it('round-trips a date input value', () => {
    expect(formatDateInput(parseDateInput('2026-10-27')!)).toBe('2026-10-27');
  });
  it('rejects invalid input', () => {
    expect(parseDateInput('')).toBe(undefined);
    expect(parseDateInput('27.10.2026')).toBe(undefined);
    expect(parseDateInput('2026-02-31')).toBe(undefined);
  });
  it('startOfDay drops the time part', () => {
    const noon = new Date(2026, 9, 27, 12, 30).getTime();
    expect(startOfDay(noon)).toBe(new Date(2026, 9, 27).getTime());
  });
});

describe('time helpers', () => {
  it('parses and formats times', () => {
    expect(parseTimeInput('14:30')).toBe(870);
    expect(parseTimeInput('9:05')).toBe(545);
    expect(parseTimeInput('24:00')).toBe(undefined);
    expect(parseTimeInput('12:60')).toBe(undefined);
    expect(parseTimeInput('')).toBe(undefined);
    expect(formatTimeInput(new Date(2026, 9, 27, 7, 5).getTime())).toBe('07:05');
  });
  it('lists time slots', () => {
    const slots = timeSlots(5);
    expect(slots).toHaveLength(288);
    expect(slots[0]).toBe('00:00');
    expect(slots[slots.length - 1]).toBe('23:55');
  });
  it('combines a date and a time into a deadline', () => {
    expect(combineDeadline('2026-10-27', '14:30')).toEqual({ deadline: new Date(2026, 9, 27, 14, 30).getTime(), hasTime: true });
    expect(combineDeadline('2026-10-27', '')).toEqual({ deadline: new Date(2026, 9, 27).getTime(), hasTime: false });
    expect(combineDeadline('', '14:30')).toBe(undefined);
  });
  it('formats a deadline with and without time', () => {
    const ts = new Date(2026, 9, 27, 14, 30).getTime();
    expect(formatDeadline(ts, true).endsWith('14:30')).toBe(true);
    expect(formatDeadline(ts).includes('14:30')).toBe(false);
  });
});
