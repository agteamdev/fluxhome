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

/** Short human readable date for the UI, e.g. "27 Oct". */
export function formatDeadline(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
