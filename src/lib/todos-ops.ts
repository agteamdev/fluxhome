import type { Priority, Todo } from './types';
import { startOfDay } from '@/utils/date';

/** Pure functions for the todo list (no storage, no DOM). */

const RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function addTodo(todos: Todo[], todo: Todo): Todo[] {
  return [...todos, todo];
}

export function toggleTodo(todos: Todo[], id: string): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

export function updateTodo(
  todos: Todo[],
  id: string,
  changes: Partial<Pick<Todo, 'text' | 'priority' | 'deadline' | 'hasTime'>>,
): Todo[] {
  return todos.map((t) => (t.id === id ? { ...t, ...changes } : t));
}

export function deleteTodo(todos: Todo[], id: string): Todo[] {
  return todos.filter((t) => t.id !== id);
}

export function clearCompleted(todos: Todo[]): Todo[] {
  return todos.filter((t) => !t.done);
}

/** Open tasks first; then by priority (high first); then by deadline (earliest first, no deadline last). */
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.priority !== b.priority) return RANK[a.priority] - RANK[b.priority];
    const da = a.deadline ?? Number.POSITIVE_INFINITY;
    const db = b.deadline ?? Number.POSITIVE_INFINITY;
    return da === db ? 0 : da < db ? -1 : 1;
  });
}

/**
 * A task is overdue when it is not done and its deadline has passed:
 * with a time, from that exact moment; without a time, once the deadline day is over.
 */
export function isOverdue(todo: Todo, now: number): boolean {
  if (todo.done || todo.deadline === undefined) return false;
  return todo.hasTime ? todo.deadline < now : todo.deadline < startOfDay(now);
}
