import { storage } from './storage';
import type { ActiveTracker, CalendarEvent, Countdown, Note, TimeEntry, Todo } from './types';

/** Read-modify-write helpers for the global notes and todos lists. */
export async function updateNotes(transform: (notes: Note[]) => Note[]): Promise<void> {
  const notes = (await storage.get('notes')) ?? [];
  await storage.set('notes', transform(notes));
}

export async function updateTodos(transform: (todos: Todo[]) => Todo[]): Promise<void> {
  const todos = (await storage.get('todos')) ?? [];
  await storage.set('todos', transform(todos));
}

export async function updateEvents(transform: (events: CalendarEvent[]) => CalendarEvent[]): Promise<void> {
  const events = (await storage.get('events')) ?? [];
  await storage.set('events', transform(events));
}

export async function updateTimeEntries(transform: (entries: TimeEntry[]) => TimeEntry[]): Promise<void> {
  const entries = (await storage.get('timeEntries')) ?? [];
  await storage.set('timeEntries', transform(entries));
}

export async function setActiveTracker(value: ActiveTracker | null): Promise<void> {
  await storage.set('activeTracker', value);
}

export async function setCountdown(value: Countdown | null): Promise<void> {
  await storage.set('countdown', value);
}

/** Ends the running session: saves it (when it was long enough) and clears the tracker in one write. */
export async function saveFinishedSession(entry: TimeEntry | null): Promise<void> {
  const entries = (await storage.get('timeEntries')) ?? [];
  await storage.setMany({ timeEntries: entry ? [...entries, entry] : entries, activeTracker: null });
}
