import { describe, expect, it } from 'vitest';
import { formatDateInput, parseDateInput, startOfDay } from './date';

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
