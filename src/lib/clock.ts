/** Pure helpers for the clock widget (time zones, formatting, hand angles). */

export type ClockMode = 'digital' | 'analog';

export interface ClockOptions {
  mode: ClockMode;
  hour12: boolean;
  /** Extra time zones (IANA names) shown under the main clock. */
  zones: string[];
}

export const MAX_ZONES = 6;

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Reads widget props defensively (they come from storage or from an imported file). */
export function parseClockOptions(props: Record<string, unknown>): ClockOptions {
  const zones = Array.isArray(props.zones)
    ? props.zones.filter((z): z is string => typeof z === 'string' && isValidTimeZone(z)).slice(0, MAX_ZONES)
    : [];
  return {
    mode: props.mode === 'analog' ? 'analog' : 'digital',
    hour12: props.hour12 === true,
    zones,
  };
}

/** "America/New_York" -> "New York". */
export function zoneLabel(timeZone: string): string {
  const last = timeZone.split('/').pop() ?? timeZone;
  return last.replace(/_/g, ' ');
}

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
}

export function getTimeParts(date: Date, timeZone: string): TimeParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { hours: get('hour'), minutes: get('minute'), seconds: get('second') };
}

/** Rotation of each clock hand in degrees (0 = pointing at 12). */
export function handAngles(time: TimeParts): { hour: number; minute: number; second: number } {
  return {
    hour: (time.hours % 12) * 30 + time.minutes * 0.5,
    minute: time.minutes * 6 + time.seconds * 0.1,
    second: time.seconds * 6,
  };
}

export function formatTime(date: Date, timeZone: string, hour12: boolean, withSeconds: boolean, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hourCycle: hour12 ? 'h12' : 'h23',
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  }).format(date);
}

function calendarDay(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get('year'), get('month') - 1, get('day')) / 86_400_000;
}

/** How many calendar days `timeZone` is ahead of (+1) or behind (-1) `baseTimeZone` right now. */
export function dayOffset(date: Date, timeZone: string, baseTimeZone: string): number {
  return calendarDay(date, timeZone) - calendarDay(date, baseTimeZone);
}

// ---------------------------------------------------------------------------
// Time zone list for the picker
// ---------------------------------------------------------------------------

/** Used only when the browser cannot list its time zones (very old engines). */
const FALLBACK_ZONES = [
  'UTC', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Kyiv', 'Europe/Moscow', 'Europe/Istanbul',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo',
  'Africa/Cairo', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Shanghai',
  'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland',
];

/** Every time zone this browser supports (so every entry is guaranteed to work), sorted, with UTC. */
export function listTimeZones(): string[] {
  const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
  let zones: string[] = [];
  try {
    zones = supported ? supported.call(Intl, 'timeZone') : [];
  } catch {
    zones = [];
  }
  if (zones.length === 0) zones = FALLBACK_ZONES;
  return [...new Set(['UTC', ...zones])].filter(isValidTimeZone).sort((a, b) => a.localeCompare(b));
}

/** "America/Argentina/Buenos_Aires" -> "America"; "UTC" -> "UTC". */
export function zoneRegion(timeZone: string): string {
  return timeZone.includes('/') ? timeZone.split('/')[0]! : timeZone;
}

/** "GMT+9", "GMT-3:30" or "GMT" for the zone at the given moment ("" if unsupported). */
export function zoneOffsetLabel(timeZone: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(date);
    const label = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    // Engines disagree on how to print a zero offset ("GMT", "GMT+0", "UTC"): show "GMT" everywhere
    return /^(GMT|UTC)([+-]0(:00)?)?$/.test(label) ? 'GMT' : label;
  } catch {
    return '';
  }
}

// Old and new spellings of the same city
const ALIASES: Record<string, string> = { kiev: 'kyiv', kyiv: 'kiev', calcutta: 'kolkata', kolkata: 'calcutta', rangoon: 'yangon', yangon: 'rangoon' };

/** Case-insensitive filter; "new york" matches "America/New_York". An empty query keeps everything. */
export function filterZones(zones: string[], query: string): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return zones;
  return zones.filter((zone) => {
    const text = zone.toLowerCase().replace(/[/_]/g, ' ');
    return words.every((w) => text.includes(w) || (ALIASES[w] !== undefined && text.includes(ALIASES[w]!)));
  });
}

/** Groups zones by region, keeping the input order. */
export function groupZones(zones: string[]): { region: string; zones: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const zone of zones) {
    const region = zoneRegion(zone);
    groups.set(region, [...(groups.get(region) ?? []), zone]);
  }
  return [...groups].map(([region, list]) => ({ region, zones: list }));
}
