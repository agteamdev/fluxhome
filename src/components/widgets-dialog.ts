import { el } from './dom';
import { applyWidgetSelection } from '@/lib/page-ops';
import { updatePage } from '@/lib/page-store';
import type { Page, WidgetType } from '@/lib/types';
import { uid } from '@/utils/id';

const CHOICES: { type: WidgetType; label: string }[] = [
  { type: 'bookmarks', label: 'Bookmarks' },
  { type: 'search', label: 'Web search' },
  { type: 'clock', label: 'Clock' },
  { type: 'notes', label: 'Notes' },
  { type: 'todos', label: 'Todos' },
];

/** Shows one checkbox per widget type. Resolves with the checked types, or null if cancelled. */
function askWidgets(current: Set<WidgetType>): Promise<WidgetType[] | null> {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'dialog' });
    const form = el('form', { class: 'dialog-form' });
    const boxes = new Map<WidgetType, HTMLInputElement>();

    form.append(
      el('h3', { class: 'dialog-title', text: 'Widgets' }),
      el('p', { class: 'muted', text: 'Choose what to show on this page. Hiding a widget does not delete your bookmarks, notes or todos.' }),
    );
    for (const choice of CHOICES) {
      const box = el('input', { attrs: { type: 'checkbox' } });
      box.checked = current.has(choice.type);
      boxes.set(choice.type, box);
      form.append(el('label', { class: 'dialog-check' }, [box, el('span', { text: choice.label })]));
    }

    const cancel = el('button', { class: 'btn', text: 'Cancel', attrs: { type: 'button' } });
    const save = el('button', { class: 'btn primary', text: 'Save', attrs: { type: 'submit' } });
    form.append(el('div', { class: 'dialog-buttons' }, [cancel, save]));
    dialog.append(form);

    let result: WidgetType[] | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      result = CHOICES.filter((c) => boxes.get(c.type)!.checked).map((c) => c.type);
      dialog.close();
    });
    cancel.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });

    document.body.append(dialog);
    dialog.showModal();
  });
}

/** Header button that lets the user show or hide widgets on the current page. */
export function renderWidgetsButton(page: Page, columnsCount: number): HTMLButtonElement {
  const button = el('button', { class: 'btn', text: 'Widgets', attrs: { type: 'button', title: 'Show or hide widgets' } });
  button.addEventListener('click', () => {
    void (async () => {
      const wanted = await askWidgets(new Set(page.widgets.map((w) => w.type)));
      if (!wanted) return;
      await updatePage(page.id, (p) => applyWidgetSelection(p, wanted, columnsCount, uid));
    })();
  });
  return button;
}
