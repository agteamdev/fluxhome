import type { Note } from './types';

/** Pure functions for notes (no storage, no DOM). */

export function addNote(notes: Note[], note: Note): Note[] {
  return [...notes, note];
}

export function updateNote(
  notes: Note[],
  id: string,
  changes: Pick<Note, 'title' | 'content'>,
  now: number,
): Note[] {
  return notes.map((n) => (n.id === id ? { ...n, ...changes, updatedAt: now } : n));
}

export function deleteNote(notes: Note[], id: string): Note[] {
  return notes.filter((n) => n.id !== id);
}

export function togglePin(notes: Note[], id: string): Note[] {
  return notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n));
}

/** Pinned notes first; inside each group the most recently updated note comes first. */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

const firstLine = (content: string): string => content.split('\n').find((line) => line.trim() !== '')?.trim() ?? '';

/** Title used when the user leaves the title empty: the first line of the content. */
export function deriveTitle(content: string): string {
  const line = firstLine(content)
    .replace(/^#{1,6}\s+/, '')
    .replace(/[*`_]/g, '')
    .trim();
  if (!line) return 'Untitled';
  return line.length > 60 ? `${line.slice(0, 57)}…` : line;
}

/** One-line preview of a note: the first non-empty line of the content that is not its title. */
export function notePreview(note: Note, maxLength = 90): string {
  const lines = note.content.split('\n').map((l) => l.trim()).filter(Boolean);
  const plain = (l: string) => l.replace(/^#{1,6}\s+/, '').replace(/[*`]/g, '');
  const line = lines.map(plain).find((l) => l !== note.title) ?? '';
  return line.length > maxLength ? `${line.slice(0, maxLength - 1)}…` : line;
}
