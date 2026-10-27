import { describe, expect, it } from 'vitest';
import { addTodo, clearCompleted, deleteTodo, isOverdue, sortTodos, toggleTodo, updateTodo } from './todos-ops';
import type { Todo } from './types';

const todo = (id: string, extra: Partial<Todo> = {}): Todo => ({ id, text: id, done: false, priority: 'medium', ...extra });
const ids = (list: Todo[]) => list.map((t) => t.id);

describe('todo operations', () => {
  it('adds, toggles, updates and deletes', () => {
    let list = addTodo([], todo('a'));
    list = toggleTodo(list, 'a');
    expect(list[0]!.done).toBe(true);
    list = updateTodo(list, 'a', { text: 'New', priority: 'high' });
    expect(list[0]!.text).toBe('New');
    expect(list[0]!.priority).toBe('high');
    list = deleteTodo(list, 'a');
    expect(list).toHaveLength(0);
  });

  it('clears only completed tasks', () => {
    const list = clearCompleted([todo('a', { done: true }), todo('b')]);
    expect(ids(list)).toEqual(['b']);
  });
});

describe('sortTodos', () => {
  it('puts open tasks first, then by priority, then by deadline', () => {
    const list = [
      todo('done', { done: true, priority: 'high' }),
      todo('low', { priority: 'low' }),
      todo('med-late', { deadline: 200 }),
      todo('med-early', { deadline: 100 }),
      todo('med-none'),
      todo('high', { priority: 'high' }),
    ];
    expect(ids(sortTodos(list))).toEqual(['high', 'med-early', 'med-late', 'med-none', 'low', 'done']);
  });
  it('does not change the input array', () => {
    const list = [todo('b', { priority: 'low' }), todo('a', { priority: 'high' })];
    sortTodos(list);
    expect(ids(list)).toEqual(['b', 'a']);
  });
});

describe('isOverdue', () => {
  const today = new Date(2026, 9, 27, 15, 0).getTime();
  const yesterday = new Date(2026, 9, 26).getTime();
  const todayMidnight = new Date(2026, 9, 27).getTime();
  it('is true for a past deadline', () => {
    expect(isOverdue(todo('a', { deadline: yesterday }), today)).toBe(true);
  });
  it('is false for a deadline today', () => {
    expect(isOverdue(todo('a', { deadline: todayMidnight }), today)).toBe(false);
  });
  it('is false for done tasks and tasks without a deadline', () => {
    expect(isOverdue(todo('a', { deadline: yesterday, done: true }), today)).toBe(false);
    expect(isOverdue(todo('a'), today)).toBe(false);
  });
});
