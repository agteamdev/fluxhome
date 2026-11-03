import type { ActiveTracker, Countdown, TimeEntry } from './types';
import { startOfDay } from '@/utils/date';

/** Pure functions for the work time tracker and the countdown timer (no storage, no DOM). */

/** A session shorter than this is treated as an accidental double click and is not saved. */
export const MIN_ENTRY_MS = 1000;
export const MAX_COUNTDOWN_MINUTES = 720;

/** Name of the browser alarm that shows a notification when a countdown ends (see background.ts). */
export const COUNTDOWN_ALARM = 'fluxhome-countdown';

export function startTracker(label: string, now: number): ActiveTracker {
  return { label: label.trim(), start: now };
}

/** Total pause time of a running session, including the pause that is going on now. */
function pausedTotal(active: ActiveTracker, now: number): number {
  return (active.pausedMs ?? 0) + (active.pausedAt !== undefined ? Math.max(0, now - active.pausedAt) : 0);
}

export const isPaused = (active: ActiveTracker): boolean => active.pausedAt !== undefined;

/** Worked time of the running session: the clock stops while it is paused. */
export function trackerElapsed(active: ActiveTracker, now: number): number {
  return Math.max(0, now - active.start - pausedTotal(active, now));
}

export function pauseTracker(active: ActiveTracker, now: number): ActiveTracker {
  return isPaused(active) ? active : { ...active, pausedAt: now };
}

export function resumeTracker(active: ActiveTracker, now: number): ActiveTracker {
  if (active.pausedAt === undefined) return active;
  const { pausedAt, ...rest } = active;
  return { ...rest, pausedMs: (active.pausedMs ?? 0) + Math.max(0, now - pausedAt) };
}

/** Ends the running session (also when it is paused). Returns null when the worked time was too short to keep. */
export function finishTracker(active: ActiveTracker, now: number, id: string, fallbackLabel: string): TimeEntry | null {
  if (trackerElapsed(active, now) < MIN_ENTRY_MS) return null;
  const pausedMs = pausedTotal(active, now);
  return { id, label: active.label || fallbackLabel, start: active.start, end: now, ...(pausedMs > 0 ? { pausedMs } : {}) };
}

/** 3725000 -> "1:02:05" (or "1:02" without seconds). */
export function formatDuration(ms: number, withSeconds = true): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return withSeconds ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${hours}:${pad(minutes)}`;
}

/** Worked time of a finished session (pauses are not counted). */
export const entryDuration = (entry: TimeEntry): number => Math.max(0, entry.end - entry.start - (entry.pausedMs ?? 0));

export function totalDuration(entries: TimeEntry[]): number {
  return entries.reduce((sum, e) => sum + entryDuration(e), 0);
}

/** Sessions that started today (local time), newest first. */
export function entriesForDay(entries: TimeEntry[], now: number): TimeEntry[] {
  const from = startOfDay(now);
  const to = new Date(from).setDate(new Date(from).getDate() + 1);
  return entries.filter((e) => e.start >= from && e.start < to).sort((a, b) => b.start - a.start);
}

/** Time worked today and during the last 7 days (today included). */
export function totals(entries: TimeEntry[], now: number): { today: number; week: number } {
  const today = startOfDay(now);
  const weekStart = new Date(today).setDate(new Date(today).getDate() - 6);
  const to = new Date(today).setDate(new Date(today).getDate() + 1);
  const inRange = (from: number) => entries.filter((e) => e.start >= from && e.start < to);
  return { today: totalDuration(inRange(today)), week: totalDuration(inRange(weekStart)) };
}

/** The most recently used distinct labels, newest first. */
export function recentLabels(entries: TimeEntry[], count: number): string[] {
  const seen = new Set<string>();
  for (const entry of [...entries].sort((a, b) => b.end - a.end)) {
    if (entry.label) seen.add(entry.label);
    if (seen.size >= count) break;
  }
  return [...seen];
}

export const addEntry = (entries: TimeEntry[], entry: TimeEntry): TimeEntry[] => [...entries, entry];
export const deleteEntry = (entries: TimeEntry[], id: string): TimeEntry[] => entries.filter((e) => e.id !== id);
export const renameEntry = (entries: TimeEntry[], id: string, label: string): TimeEntry[] =>
  entries.map((e) => (e.id === id ? { ...e, label } : e));

/** "25" -> 25, "1:30" -> 90, "abc" or out of range -> null. */
export function parseMinutes(input: string): number | null {
  const text = input.trim();
  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(text);
  const minutes = clock ? Number(clock[1]) * 60 + Number(clock[2]) : /^\d{1,3}$/.test(text) ? Number(text) : NaN;
  return Number.isFinite(minutes) && minutes >= 1 && minutes <= MAX_COUNTDOWN_MINUTES ? minutes : null;
}

export function startCountdown(minutes: number, now: number, label: string): Countdown {
  const durationMs = minutes * 60_000;
  return { end: now + durationMs, durationMs, label: label.trim() };
}

export const remainingMs = (countdown: Countdown, now: number): number => Math.max(0, countdown.end - now);
export const isFinished = (countdown: Countdown, now: number): boolean => countdown.end <= now;

/** Time left on a countdown: "25:00" below one hour, "1:05:00" from one hour. Rounds up, so it starts at the full time. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
