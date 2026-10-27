import { describe, expect, it } from 'vitest';
import { addNote, deleteNote, deriveTitle, notePreview, sortNotes, togglePin, updateNote } from './notes-ops';
import type { Note } from './types';

const note = (id: string, extra: Partial<Note> = {}): Note => ({
  id,
  title: id,
  content: '',
  pinned: false,
  createdAt: 1,
  updatedAt: 1,
  ...extra,
});

describe('note operations', () => {
  it('adds, updates (bumping updatedAt), pins and deletes', () => {
    let list = addNote([], note('a'));
    list = updateNote(list, 'a', { title: 'T', content: 'C' }, 99);
    expect(list[0]).toEqual({ ...note('a'), title: 'T', content: 'C', updatedAt: 99 });
    list = togglePin(list, 'a');
    expect(list[0]!.pinned).toBe(true);
    list = deleteNote(list, 'a');
    expect(list).toHaveLength(0);
  });
});

describe('sortNotes', () => {
  it('puts pinned first, then newest first', () => {
    const list = [note('old', { updatedAt: 1 }), note('new', { updatedAt: 5 }), note('pin', { pinned: true, updatedAt: 0 })];
    expect(sortNotes(list).map((n) => n.id)).toEqual(['pin', 'new', 'old']);
  });
});

describe('deriveTitle', () => {
  it('uses the first line without markdown marks', () => {
    expect(deriveTitle('\n\n# **Shopping** list\nmilk')).toBe('Shopping list');
  });
  it('falls back to Untitled', () => {
    expect(deriveTitle('   \n ')).toBe('Untitled');
  });
  it('truncates long titles', () => {
    expect(deriveTitle('x'.repeat(100))).toHaveLength(58);
  });
});

describe('notePreview', () => {
  it('skips the line that equals the title', () => {
    expect(notePreview(note('a', { title: 'Shopping', content: '# Shopping\n- milk\n- eggs' }))).toBe('- milk');
  });
  it('is empty for an empty note', () => {
    expect(notePreview(note('a'))).toBe('');
  });
});
