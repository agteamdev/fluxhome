import { el } from '@/components/dom';
import { openFormDialog } from '@/components/dialog';
import { warningIcon } from '@/components/icons';
import { widgetFrame } from '@/components/widget-frame';
import { locale, t } from '@/lib/i18n';
import { updateTodos } from '@/lib/list-store';
import { addTodo, clearCompleted, deleteTodo, isOverdue, sortTodos, toggleTodo, updateTodo } from '@/lib/todos-ops';
import type { Priority, Todo, WidgetConfig } from '@/lib/types';
import { combineDeadline, formatDateInput, formatDeadline, formatTimeInput, timeSlots } from '@/utils/date';
import { uid } from '@/utils/id';

const priorityLabel = (priority: Priority): string => t(`prio.${priority}`);
const priorityOptions = (): { value: string; label: string }[] => [
  { value: 'low', label: t('prio.low') },
  { value: 'medium', label: t('prio.medium') },
  { value: 'high', label: t('prio.high') },
];

function smallButton(text: string, label: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', { class: 'btn small', text, attrs: { type: 'button', title: label, 'aria-label': label } });
  button.addEventListener('click', onClick);
  return button;
}

interface TodoValues {
  text: string;
  priority: Priority;
  deadline: number | undefined;
  hasTime: boolean | undefined;
}

/** Time choices every 5 minutes (plus the task's own time if it is not on that grid). */
function timeOptions(current: string): { value: string; label: string }[] {
  const slots = timeSlots(5);
  if (current && !slots.includes(current)) slots.push(current);
  slots.sort();
  return [{ value: '', label: t('todo.noTime') }, ...slots.map((t) => ({ value: t, label: t }))];
}

/** Asks for the task text, priority and deadline (date and optional time). Resolves with the values, or null. */
async function askTodo(heading: string, submitLabel: string, initial?: Todo): Promise<TodoValues | null> {
  const initialTime = initial?.deadline !== undefined && initial.hasTime ? formatTimeInput(initial.deadline) : '';
  const values = await openFormDialog({
    title: heading,
    submitLabel,
    fields: [
      { name: 'text', label: t('todo.task'), value: initial?.text ?? '', required: true },
      { name: 'priority', label: t('todo.priority'), value: initial?.priority ?? 'medium', options: priorityOptions() },
      {
        name: 'deadline',
        label: t('todo.deadline'),
        type: 'date',
        placeholder: t('todo.noDeadline'),
        value: initial?.deadline !== undefined ? formatDateInput(initial.deadline) : '',
      },
      {
        name: 'time',
        label: t('todo.time'),
        value: initialTime,
        options: timeOptions(initialTime),
        searchable: true,
      },
    ],
    validate: (v) => (v.time && !v.deadline ? t('todo.needDate') : null),
  });
  if (!values) return null;
  const combined = combineDeadline(values.deadline ?? '', values.time ?? '');
  return {
    text: values.text!,
    priority: values.priority as Priority,
    deadline: combined?.deadline,
    hasTime: combined?.hasTime ? true : undefined,
  };
}

/** Todos widget: tasks with checkboxes, priorities and deadlines; new tasks are added in a dialog. */
export function renderTodosWidget(widget: WidgetConfig, todos: Todo[]): HTMLElement {
  const doneCount = todos.filter((t) => t.done).length;
  const addButton = smallButton(t('todo.add'), t('todo.addTip'), () => void onAdd());
  const clearButton = smallButton(t('todo.clearDone'), t('todo.clearTip'), () => {
    void updateTodos(clearCompleted);
  });
  clearButton.disabled = doneCount === 0;
  const { root, body } = widgetFrame(widget, t('todo.title'), [addButton, clearButton]);

  async function onAdd(): Promise<void> {
    const data = await askTodo(t('todo.new'), t('common.add'));
    if (!data) return;
    const todo: Todo = { id: uid(), done: false, text: data.text, priority: data.priority };
    if (data.deadline !== undefined) {
      todo.deadline = data.deadline;
      if (data.hasTime) todo.hasTime = true;
    }
    await updateTodos((list) => addTodo(list, todo));
  }

  async function onEdit(todo: Todo): Promise<void> {
    const data = await askTodo(t('todo.edit'), t('common.save'), todo);
    if (!data) return;
    await updateTodos((list) => updateTodo(list, todo.id, data));
  }

  if (todos.length === 0) {
    body.append(el('p', { class: 'muted', text: t('todo.empty') }));
    return root;
  }

  const now = Date.now();
  const list = el('ul', { class: 'todos' });
  for (const todo of sortTodos(todos)) {
    const overdue = isOverdue(todo, now);

    const checkbox = el('input', { attrs: { type: 'checkbox', 'aria-label': t('todo.markDone', { text: todo.text }) } });
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => void updateTodos((l) => toggleTodo(l, todo.id)));

    const parts: Node[] = [];
    if (overdue) parts.push(warningIcon(t('todo.overdue')));
    parts.push(
      el('span', { class: 'todo-text', text: todo.text }),
      el('span', { class: `badge prio-${todo.priority}`, text: priorityLabel(todo.priority) }),
    );
    if (todo.deadline !== undefined) {
      parts.push(el('span', { class: overdue ? 'deadline overdue' : 'deadline', text: formatDeadline(todo.deadline, todo.hasTime, locale()) }));
    }

    list.append(
      el('li', { class: todo.done ? 'todo done' : 'todo' }, [
        checkbox,
        el('span', { class: 'todo-main' }, parts),
        el('span', { class: 'row-actions' }, [
          smallButton('✎', t('todo.editTip'), () => void onEdit(todo)),
          smallButton('✕', t('todo.deleteTip'), () => void updateTodos((l) => deleteTodo(l, todo.id))),
        ]),
      ]),
    );
  }
  body.append(list);

  // A deadline can pass while the page stays open: redraw this widget when the set of overdue tasks changes.
  // The timer stops by itself once the widget is no longer on the page (no leaks).
  const overdueIds = (time: number): string => todos.filter((t) => isOverdue(t, time)).map((t) => t.id).join(',');
  const initial = overdueIds(now);
  const timer = setInterval(() => {
    if (!root.isConnected) {
      clearInterval(timer);
      return;
    }
    if (overdueIds(Date.now()) !== initial) {
      clearInterval(timer);
      root.replaceWith(renderTodosWidget(widget, todos));
    }
  }, 30_000);

  return root;
}
