import { describe, expect, it } from 'vitest';
import {
  dayOffset,
  filterZones,
  formatTime,
  getTimeParts,
  groupZones,
  handAngles,
  isValidTimeZone,
  listTimeZones,
  parseClockOptions,
  zoneLabel,
  zoneOffsetLabel,
  zoneRegion,
} from './clock';

// 2026-10-27 14:05:30 UTC
const date = new Date(Date.UTC(2026, 9, 27, 14, 5, 30));

describe('time zones', () => {
  it('validates IANA names', () => {
    expect(isValidTimeZone('Europe/Berlin')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Nope/Zone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
  it('builds a readable label', () => {
    expect(zoneLabel('America/New_York')).toBe('New York');
    expect(zoneLabel('UTC')).toBe('UTC');
  });
});

describe('time parts and formatting', () => {
  it('reads the time in a zone', () => {
    expect(getTimeParts(date, 'UTC')).toEqual({ hours: 14, minutes: 5, seconds: 30 });
    expect(getTimeParts(date, 'Asia/Tokyo')).toEqual({ hours: 23, minutes: 5, seconds: 30 });
  });
  it('uses 0 (not 24) at midnight', () => {
    const midnight = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    expect(getTimeParts(midnight, 'UTC').hours).toBe(0);
  });
  it('formats 24-hour time', () => {
    expect(formatTime(date, 'UTC', false, false, 'en-GB')).toBe('14:05');
    expect(formatTime(date, 'UTC', false, true, 'en-GB')).toBe('14:05:30');
  });
  it('formats 12-hour time', () => {
    expect(formatTime(date, 'UTC', true, false, 'en-US')).toContain('PM');
  });
});

describe('handAngles', () => {
  it('computes the angles of the hands', () => {
    expect(handAngles({ hours: 3, minutes: 0, seconds: 0 })).toEqual({ hour: 90, minute: 0, second: 0 });
    expect(handAngles({ hours: 0, minutes: 30, seconds: 0 })).toEqual({ hour: 15, minute: 180, second: 0 });
    expect(handAngles({ hours: 12, minutes: 0, seconds: 15 }).second).toBe(90);
  });
});

describe('dayOffset', () => {
  it('detects tomorrow and yesterday', () => {
    const lateEvening = new Date(Date.UTC(2026, 9, 27, 23, 30));
    expect(dayOffset(lateEvening, 'Asia/Tokyo', 'UTC')).toBe(1);
    const earlyMorning = new Date(Date.UTC(2026, 9, 27, 5, 0));
    expect(dayOffset(earlyMorning, 'Pacific/Honolulu', 'UTC')).toBe(-1);
    expect(dayOffset(date, 'UTC', 'UTC')).toBe(0);
  });
});

describe('parseClockOptions', () => {
  it('falls back to defaults', () => {
    expect(parseClockOptions({})).toEqual({ mode: 'digital', hour12: false, zones: [] });
  });
  it('keeps valid values and drops invalid zones', () => {
    expect(parseClockOptions({ mode: 'analog', hour12: true, zones: ['Asia/Tokyo', 'Bad/Zone', 5] })).toEqual({
      mode: 'analog',
      hour12: true,
      zones: ['Asia/Tokyo'],
    });
  });
  it('limits the number of zones', () => {
    const zones = Array(10).fill('UTC');
    expect(parseClockOptions({ zones }).zones).toHaveLength(6);
  });
});

describe('time zone picker helpers', () => {
  const zones = ['Africa/Cairo', 'America/Argentina/Buenos_Aires', 'America/New_York', 'Europe/Kyiv', 'UTC'];

  it('lists only valid zones, sorted, unique, including UTC', () => {
    const list = listTimeZones();
    expect(list.includes('UTC')).toBe(true);
    expect(list.includes('Europe/Berlin')).toBe(true);
    expect(list.every(isValidTimeZone)).toBe(true);
    expect(new Set(list).size).toBe(list.length);
    expect(list.length > 20).toBe(true);
  });
  it('finds the region of a zone', () => {
    expect(zoneRegion('America/Argentina/Buenos_Aires')).toBe('America');
    expect(zoneRegion('UTC')).toBe('UTC');
  });
  it('builds an offset label', () => {
    expect(zoneOffsetLabel('Asia/Tokyo', date)).toBe('GMT+9');
    expect(zoneOffsetLabel('UTC', date)).toBe('GMT');
  });
  it('filters ignoring case, slashes and underscores', () => {
    expect(filterZones(zones, 'new york')).toEqual(['America/New_York']);
    expect(filterZones(zones, 'AMERICA')).toEqual(['America/Argentina/Buenos_Aires', 'America/New_York']);
    expect(filterZones(zones, '')).toEqual(zones);
    expect(filterZones(zones, 'zzz')).toEqual([]);
  });
  it('knows old and new spellings of Kyiv', () => {
    expect(filterZones(zones, 'kiev')).toEqual(['Europe/Kyiv']);
  });
  it('groups by region', () => {
    expect(groupZones(zones).map((g) => g.region)).toEqual(['Africa', 'America', 'Europe', 'UTC']);
    expect(groupZones(zones)[1]!.zones).toHaveLength(2);
  });
});
