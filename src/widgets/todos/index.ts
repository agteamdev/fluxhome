import { createDatePicker } from '@/components/date-picker';
import { el } from '@/components/dom';
import { createSelect } from '@/components/select';
import { openFormDialog } from '@/components/dialog';
import { widgetFrame } from '@/components/widget-frame';
import { updateTodos } from '@/lib/list-store';
import { addTodo, clearCompleted, deleteTodo, isOverdue, sortTodos, toggleTodo, updateTodo } from '@/lib/todos-ops';
import type { Priority, Todo, WidgetConfig } from '@/lib/types';
import { formatDateInput, formatDeadline, parseDateInput } from '@/utils/date';
import { uid } from '@/utils/id';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
const PRIORITY_LABEL: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

/** Widgets whose add field should get the focus back after the page re-renders. */
const refocus = new Set<string>();

function smallButton(text: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', { class: 'btn small', text, attrs: { type: 'button', title: label, 'aria-label': label } });
  button.addEventListener('click', onClick);
  return button;
}

/** Todos widget: quick-add row, checkboxes, priorities, deadlines. */
export function renderTodosWidget(widget: WidgetConfig, todos: Todo[]): HTMLElement {
  const doneCount = todos.filter((t) => t.done).length;
  const clearButton = smallButton('Clear done', 'Delete all completed tasks', () => {
    void updateTodos(clearCompleted);
  });
  clearButton.disabled = doneCount === 0;
  const { root, body } = widgetFrame(widget, 'Todos', [clearButton]);

  // ---- quick-add row ----
  const textInput = el('input', {
    class: 'todo-input',
    attrs: { type: 'text', placeholder: 'Add a task…', autocomplete: 'off', 'aria-label': 'New task' },
  });
  const prioritySelect = createSelect({ items: PRIORITY_OPTIONS, value: 'medium', ariaLabel: 'Priority' });
  const datePicker = createDatePicker({ placeholder: 'No deadline', ariaLabel: 'Deadline' });
  const addButton = el('button', { class: 'btn primary small', text: 'Add', attrs: { type: 'submit' } });

  const form = el('form', { class: 'todo-add' }, [textInput, el('div', { class: 'todo-add-row' }, [prioritySelect.element, datePicker.element, addButton])]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = textInput.value.trim();
    if (!text) return;
    const todo: Todo = { id: uid(), text, done: false, priority: prioritySelect.value as Priority };
    const deadline = parseDateInput(datePicker.value);
    if (deadline !== undefined) todo.deadline = deadline;
    refocus.add(widget.id);
    void updateTodos((list) => addTodo(list, todo));
  });
  body.append(form);
  if (refocus.delete(widget.id)) setTimeout(() => textInput.focus(), 0);

  // ---- list ----
  async function onEdit(todo: Todo): Promise<void> {
    const values = await openFormDialog({
      title: 'Edit task',
      submitLabel: 'Save',
      fields: [
        { name: 'text', label: 'Task', value: todo.text, required: true },
        { name: 'priority', label: 'Priority', value: todo.priority, options: PRIORITY_OPTIONS },
        { name: 'deadline', label: 'Deadline (optional)', type: 'date', value: todo.deadline ? formatDateInput(todo.deadline) : '' },
      ],
    });
    if (!values) return;
    await updateTodos((list) =>
      updateTodo(list, todo.id, {
        text: values.text!,
        priority: values.priority as Priority,
        deadline: parseDateInput(values.deadline ?? ''),
      }),
    );
  }

  if (todos.length === 0) {
    body.append(el('p', { class: 'muted', text: 'Nothing to do. Enjoy!' }));
    return root;
  }

  const now = Date.now();
  const list = el('ul', { class: 'todos' });
  for (const todo of sortTodos(todos)) {
    const checkbox = el('input', { attrs: { type: 'checkbox', 'aria-label': `Mark “${todo.text}” as done` } });
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => void updateTodos((l) => toggleTodo(l, todo.id)));

    const parts: HTMLElement[] = [
      el('span', { class: 'todo-text', text: todo.text }),
      el('span', { class: `badge prio-${todo.priority}`, text: PRIORITY_LABEL[todo.priority] }),
    ];
    if (todo.deadline !== undefined) {
      const overdue = isOverdue(todo, now);
      parts.push(el('span', { class: overdue ? 'deadline overdue' : 'deadline', text: formatDeadline(todo.deadline) }));
    }

    list.append(
      el('li', { class: todo.done ? 'todo done' : 'todo' }, [
        checkbox,
        el('span', { class: 'todo-main' }, parts),
        el('span', { class: 'row-actions always' }, [
          smallButton('✎', 'Edit task', () => void onEdit(todo)),
          smallButton('✕', 'Delete task', () => void updateTodos((l) => deleteTodo(l, todo.id))),
        ]),
      ]),
    );
  }
  body.append(list);
  return root;
}
