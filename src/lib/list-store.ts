import { storage } from './storage';
import type { Note, Todo } from './types';

/** Read-modify-write helpers for the global notes and todos lists. */
export async function updateNotes(transform: (notes: Note[]) => Note[]): Promise<void> {
  const notes = (await storage.get('notes')) ?? [];
  await storage.set('notes', transform(notes));
}

export async function updateTodos(transform: (todos: Todo[]) => Todo[]): Promise<void> {
  const todos = (await storage.get('todos')) ?? [];
  await storage.set('todos', transform(todos));
}
