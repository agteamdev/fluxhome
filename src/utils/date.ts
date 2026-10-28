/** Start of the local day (00:00) for a timestamp. */
export function startOfDay(timestamp: number): number {
  const d = new Date(timestamp);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "2026-10-27" (value of <input type="date">) -> local midnight timestamp, or undefined if invalid. */
export function parseDateInput(value: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  // Reject impossible dates such as 2026-02-31
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return undefined;
  return date.getTime();
}

/** Timestamp -> "YYYY-MM-DD" in local time (for <input type="date">). */
export function formatDateInput(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Short human readable deadline for the UI: "27 Oct" or, with a time, "27 Oct, 14:30". */
export function formatDeadline(timestamp: number, hasTime = false, locale?: string): string {
  const date = new Date(timestamp);
  const day = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return hasTime ? `${day}, ${formatTimeInput(timestamp)}` : day;
}

/** "14:30" -> minutes since midnight (870), or undefined if invalid. Accepts "9:05" too. */
export function parseTimeInput(value: string): number | undefined {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : undefined;
}

/** Timestamp -> "HH:MM" in local time. */
export function formatTimeInput(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Every `stepMinutes` minutes of a day as "HH:MM": 00:00, 00:05, ... */
export function timeSlots(stepMinutes = 5): string[] {
  const pad = (n: number) => String(n).padStart(2, '0');
  const slots: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    slots.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  return slots;
}

/**
 * Combines a date ("YYYY-MM-DD") and an optional time ("HH:MM") into a deadline.
 * Returns undefined when there is no valid date. `hasTime` tells whether a time was given.
 */
export function combineDeadline(date: string, time: string): { deadline: number; hasTime: boolean } | undefined {
  const day = parseDateInput(date);
  if (day === undefined) return undefined;
  const minutes = parseTimeInput(time);
  if (minutes === undefined) return { deadline: day, hasTime: false };
  const d = new Date(day);
  return { deadline: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, minutes).getTime(), hasTime: true };
}
