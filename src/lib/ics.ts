import type { CalendarEvent, Repeat } from './types';

/**
 * A small reader for .ics calendar files (the format exported by Google Calendar, Outlook, Thunderbird, ...).
 * It reads titles, dates, times and simple repeats. Everything is read on the device, nothing is uploaded.
 */
export interface IcsResult {
  events: Omit<CalendarEvent, 'id'>[];
  /** Events that could not be read (no title or no valid date). */
  skipped: number;
  /** Events that repeat in a way FluxHome cannot show; they were imported as a single event. */
  simplified: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

function unfold(text: string): string[] {
  return text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();
}

/** "20261027", "20261027T143000" or "20261027T143000Z" -> local date and time. */
function parseDateTime(value: string): { date: string; time?: string } | null {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (!match) return null;
  const [, y, mo, d, h, mi, , z] = match;
  if (h === undefined) return validDate(Number(y), Number(mo), Number(d)) ? { date: `${y}-${mo}-${d}` } : null;

  let date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  if (z) date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi))); // UTC -> local time
  if (Number.isNaN(date.getTime())) return null;
  return { date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`, time: `${pad(date.getHours())}:${pad(date.getMinutes())}` };
}

function validDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

const FREQUENCIES: Record<string, Repeat> = { DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly', YEARLY: 'yearly' };

/** A repeat rule that FluxHome understands completely (only FREQ, nothing else) becomes a repeat; others are simplified. */
function parseRepeat(rule: string | undefined): { repeat: Repeat; simplified: boolean } {
  if (!rule) return { repeat: 'none', simplified: false };
  const parts = Object.fromEntries(rule.split(';').map((p) => p.split('=') as [string, string]));
  const repeat = FREQUENCIES[parts.FREQ ?? ''];
  const extras = Object.keys(parts).filter((k) => k !== 'FREQ' && !(k === 'INTERVAL' && parts[k] === '1'));
  if (!repeat || extras.length > 0) return { repeat: 'none', simplified: true };
  return { repeat, simplified: false };
}

export function parseIcs(text: string, limit = 2000): IcsResult {
  const result: IcsResult = { events: [], skipped: 0, simplified: 0 };
  let current: Record<string, string> | null = null;

  for (const line of unfold(text)) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current) {
        if (result.events.length >= limit) {
          result.skipped++;
        } else {
          const title = unescapeText(current.SUMMARY ?? '').slice(0, 200);
          const start = parseDateTime(current.DTSTART ?? '');
          if (!title || !start) {
            result.skipped++;
          } else {
            const { repeat, simplified } = parseRepeat(current.RRULE);
            if (simplified) result.simplified++;
            result.events.push({ title, date: start.date, ...(start.time ? { time: start.time } : {}), repeat });
          }
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const colon = line.indexOf(':');
    if (colon < 1) continue;
    const name = (line.slice(0, colon).split(';')[0] ?? '').toUpperCase();
    if (name === 'SUMMARY' || name === 'DTSTART' || name === 'RRULE') current[name] ??= line.slice(colon + 1);
  }
  return result;
}
