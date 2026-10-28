import { describe, expect, it } from 'vitest';
import { buildMonthGrid, cellValue, monthLabel, parseValue, shiftMonth, weekdayLabels } from './calendar';

describe('buildMonthGrid', () => {
  // October 2026 starts on a Thursday
  it('starts the week on Monday', () => {
    const grid = buildMonthGrid(2026, 9, 1);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ year: 2026, month: 8, day: 28, inMonth: false });
    expect(grid[3]).toEqual({ year: 2026, month: 9, day: 1, inMonth: true });
  });
  it('can start the week on Sunday', () => {
    expect(buildMonthGrid(2026, 9, 0)[0]).toEqual({ year: 2026, month: 8, day: 27, inMonth: false });
  });
  it('contains every day of the month exactly once', () => {
    expect(buildMonthGrid(2026, 1, 1).filter((c) => c.inMonth)).toHaveLength(28);
    expect(buildMonthGrid(2028, 1, 1).filter((c) => c.inMonth)).toHaveLength(29);
  });
  it('handles December and January boundaries', () => {
    const grid = buildMonthGrid(2026, 11, 1);
    expect(grid[41]!.year === 2027 || grid[41]!.month === 11).toBe(true);
  });
});

describe('values', () => {
  it('formats and parses a cell', () => {
    expect(cellValue({ year: 2026, month: 9, day: 5 })).toBe('2026-10-05');
    expect(parseValue('2026-10-05')).toEqual({ year: 2026, month: 9, day: 5 });
  });
  it('rejects invalid values', () => {
    expect(parseValue('')).toBeNull();
    expect(parseValue('2026-02-31')).toBeNull();
  });
});

describe('month helpers', () => {
  it('shifts months across year boundaries', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
  it('builds labels', () => {
    expect(monthLabel(2026, 9, 'en-US')).toBe('October 2026');
    expect(weekdayLabels(1, 'en-US')[0]).toBe('Mon');
    expect(weekdayLabels(0, 'en-US')[0]).toBe('Sun');
  });
});
