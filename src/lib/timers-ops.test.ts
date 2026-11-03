import { describe, expect, it } from 'vitest';
import {
  addEntry,
  deleteEntry,
  entriesForDay,
  entryDuration,
  finishTracker,
  isPaused,
  pauseTracker,
  resumeTracker,
  trackerElapsed,
  formatCountdown,
  formatDuration,
  isFinished,
  parseMinutes,
  recentLabels,
  remainingMs,
  renameEntry,
  startCountdown,
  startTracker,
  totalDuration,
  totals,
} from './timers-ops';
import type { TimeEntry } from './types';

const at = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m).getTime();
const entry = (id: string, label: string, start: number, end: number): TimeEntry => ({ id, label, start, end });

describe('tracker', () => {
  it('finishes a session with its label', () => {
    const active = startTracker('  Report ', at(27, 9));
    expect(active).toEqual({ label: 'Report', start: at(27, 9) });
    expect(finishTracker(active, at(27, 10, 30), 'e1', 'Work')).toEqual({ id: 'e1', label: 'Report', start: at(27, 9), end: at(27, 10, 30) });
  });
  it('uses the fallback label when none was given', () => {
    expect(finishTracker(startTracker('', at(27, 9)), at(27, 9, 5), 'e1', 'Work')!.label).toBe('Work');
  });
  it('drops accidental double clicks', () => {
    expect(finishTracker(startTracker('x', 1000), 1500, 'e1', 'Work')).toBe(null);
  });
});

describe('pause', () => {
  const min = 60_000;
  it('stops the clock while paused and continues after resuming', () => {
    let active = startTracker('Report', 0);
    expect(trackerElapsed(active, 10 * min)).toBe(10 * min);
    active = pauseTracker(active, 10 * min);
    expect(isPaused(active)).toBe(true);
    expect(trackerElapsed(active, 25 * min)).toBe(10 * min); // 15 minutes of coffee do not count
    active = resumeTracker(active, 25 * min);
    expect(isPaused(active)).toBe(false);
    expect(active.pausedMs).toBe(15 * min);
    expect(trackerElapsed(active, 35 * min)).toBe(20 * min);
  });
  it('pausing or resuming twice changes nothing', () => {
    const paused = pauseTracker(startTracker('x', 0), 5 * min);
    expect(pauseTracker(paused, 9 * min)).toBe(paused);
    const running = startTracker('x', 0);
    expect(resumeTracker(running, 9 * min)).toBe(running);
  });
  it('saves the pauses with the finished session', () => {
    let active = startTracker('Report', 0);
    active = resumeTracker(pauseTracker(active, 10 * min), 25 * min);
    const entry = finishTracker(active, 45 * min, 'e1', 'Work')!;
    expect(entry).toEqual({ id: 'e1', label: 'Report', start: 0, end: 45 * min, pausedMs: 15 * min });
    expect(entryDuration(entry)).toBe(30 * min);
  });
  it('can be stopped while paused: the open pause is counted as a pause', () => {
    const active = pauseTracker(startTracker('Report', 0), 10 * min);
    const entry = finishTracker(active, 30 * min, 'e1', 'Work')!;
    expect(entry.pausedMs).toBe(20 * min);
    expect(entryDuration(entry)).toBe(10 * min);
  });
  it('drops a session whose worked time is too short', () => {
    const active = pauseTracker(startTracker('x', 0), 500);
    expect(finishTracker(active, 60_000, 'e1', 'Work')).toBe(null);
  });
});

describe('formatDuration', () => {
  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(3_725_000)).toBe('1:02:05');
    expect(formatDuration(3_725_000, false)).toBe('1:02');
    expect(formatDuration(0)).toBe('0:00:00');
    expect(formatDuration(-5)).toBe('0:00:00');
  });
});

describe('summaries', () => {
  const entries = [
    entry('a', 'Report', at(27, 9), at(27, 10)), // today, 1 h
    entry('b', 'Mail', at(27, 11), at(27, 11, 30)), // today, 30 min
    entry('c', 'Report', at(25, 14), at(25, 16)), // 2 days ago, 2 h
    entry('d', 'Old', at(10, 14), at(10, 15)), // outside the week
  ];
  const now = at(27, 18);

  it('lists today only, newest first', () => {
    expect(entriesForDay(entries, now).map((e) => e.id)).toEqual(['b', 'a']);
  });
  it('sums today and the last 7 days', () => {
    expect(totals(entries, now)).toEqual({ today: 90 * 60_000, week: 210 * 60_000 });
    expect(totalDuration(entries)).toBe(270 * 60_000);
  });
  it('returns recent distinct labels', () => {
    expect(recentLabels(entries, 2)).toEqual(['Mail', 'Report']);
    expect(recentLabels(entries, 1)).toEqual(['Mail']);
  });
  it('edits the list', () => {
    expect(addEntry([], entries[0]!)).toHaveLength(1);
    expect(deleteEntry(entries, 'a')).toHaveLength(3);
    expect(renameEntry(entries, 'a', 'New')[0]!.label).toBe('New');
  });
});

describe('countdown', () => {
  it('parses minutes', () => {
    expect(parseMinutes('25')).toBe(25);
    expect(parseMinutes(' 1:30 ')).toBe(90);
    expect(parseMinutes('0')).toBe(null);
    expect(parseMinutes('999')).toBe(null);
    expect(parseMinutes('abc')).toBe(null);
    expect(parseMinutes('1:75')).toBe(null);
  });
  it('counts down and finishes', () => {
    const countdown = startCountdown(25, 1_000_000, ' Tea ');
    expect(countdown).toEqual({ end: 1_000_000 + 1_500_000, durationMs: 1_500_000, label: 'Tea' });
    expect(remainingMs(countdown, 1_500_000)).toBe(1_000_000);
    expect(isFinished(countdown, 2_000_000)).toBe(false);
    expect(isFinished(countdown, 2_500_000)).toBe(true);
    expect(remainingMs(countdown, 9_999_999)).toBe(0);
  });
});

describe('formatCountdown', () => {
  it('shows minutes and seconds, hours when needed', () => {
    expect(formatCountdown(25 * 60_000)).toBe('25:00');
    expect(formatCountdown(65 * 60_000)).toBe('1:05:00');
    expect(formatCountdown(59_001)).toBe('01:00');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(-5)).toBe('00:00');
  });
});
