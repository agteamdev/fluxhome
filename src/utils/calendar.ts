import { formatDateInput } from './date';

/** One cell of the month grid. `month` is 0-11 like in Date. */
export interface DayCell {
  year: number;
  month: number;
  day: number;
  inMonth: boolean;
}

/** Always 42 cells (6 weeks) so the calendar keeps the same height. weekStartsOn: 1 = Monday, 0 = Sunday. */
export function buildMonthGrid(year: number, month: number, weekStartsOn: 0 | 1 = 1): DayCell[] {
  const offset = (new Date(year, month, 1).getDay() - weekStartsOn + 7) % 7;
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - offset + i);
    cells.push({ year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  return cells;
}

/** Cell -> "YYYY-MM-DD" (the value format used by the date picker). */
export function cellValue(cell: Pick<DayCell, 'year' | 'month' | 'day'>): string {
  return formatDateInput(new Date(cell.year, cell.month, cell.day).getTime());
}

/** "2026-10-27" -> { year, month (0-11), day }, or null if invalid. */
export function parseValue(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const check = new Date(year, month, day);
  return check.getFullYear() === year && check.getMonth() === month && check.getDate() === day ? { year, month, day } : null;
}

/** Moves a (year, month) pair by `delta` months. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthLabel(year: number, month: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
}

/** Seven short weekday names starting from `weekStartsOn`. */
export function weekdayLabels(weekStartsOn: 0 | 1 = 1, locale?: string): string[] {
  // 2023-01-01 was a Sunday
  return Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2023, 0, 1 + ((weekStartsOn + i) % 7))),
  );
}
