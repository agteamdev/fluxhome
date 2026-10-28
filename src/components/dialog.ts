import { createDatePicker } from './date-picker';
import { el } from './dom';
import { createSelect } from './select';
import { t } from '@/lib/i18n';

export interface FormField {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  /** "date" shows a calendar drop-down (value format YYYY-MM-DD). */
  type?: 'text' | 'date';
  /** Renders a multi-line <textarea>. */
  multiline?: boolean;
  rows?: number;
  /** Shows a drop-down with these options. */
  options?: { value: string; label: string }[];
  /** Adds a filter box to the drop-down (useful for long lists). */
  searchable?: boolean;
}

export interface FormDialogOptions {
  title: string;
  submitLabel: string;
  fields: FormField[];
  /** Return an error message to block submitting, or null when the values are fine. */
  validate?: (values: Record<string, string>) => string | null;
}

/** A form control: the element to show and a way to read its value. */
interface Control {
  element: HTMLElement;
  getValue: () => string;
}

function createControl(field: FormField): Control {
  if (field.options) {
    const select = createSelect({
      items: field.options,
      value: field.value ?? field.options[0]!.value,
      ariaLabel: field.label,
      searchable: field.searchable,
    });
    return { element: select.element, getValue: () => select.value };
  }
  if (field.type === 'date') {
    const picker = createDatePicker({ value: field.value ?? '', placeholder: field.placeholder ?? t('common.noDate'), ariaLabel: field.label });
    return { element: picker.element, getValue: () => picker.value };
  }
  if (field.multiline) {
    const area = el('textarea', { attrs: { name: field.name, rows: String(field.rows ?? 8) } });
    area.value = field.value ?? '';
    if (field.placeholder) area.placeholder = field.placeholder;
    return { element: area, getValue: () => area.value };
  }
  const input = el('input', { attrs: { type: 'text', name: field.name, autocomplete: 'off' } });
  input.value = field.value ?? '';
  if (field.placeholder) input.placeholder = field.placeholder;
  return { element: input, getValue: () => input.value };
}

/** Shows a modal form. Resolves with the (trimmed) values, or null when cancelled. */
export function openFormDialog(options: FormDialogOptions): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: options.fields.some((f) => f.multiline) ? 'dialog wide' : 'dialog' });
    const form = el('form', { class: 'dialog-form' });
    const error = el('p', { class: 'dialog-error' });
    error.hidden = true;
    const controls = new Map<string, Control>();

    form.append(el('h3', { class: 'dialog-title', text: options.title }));
    for (const field of options.fields) {
      const control = createControl(field);
      controls.set(field.name, control);
      form.append(el('label', { class: 'dialog-field' }, [el('span', { text: field.label }), control.element]));
    }

    const cancel = el('button', { class: 'btn', text: t('common.cancel'), attrs: { type: 'button' } });
    const submit = el('button', { class: 'btn primary', text: options.submitLabel, attrs: { type: 'submit' } });
    form.append(error, el('div', { class: 'dialog-buttons' }, [cancel, submit]));
    dialog.append(form);

    let result: Record<string, string> | null = null;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values: Record<string, string> = {};
      for (const [name, control] of controls) values[name] = control.getValue().trim();

      let message: string | null = null;
      for (const field of options.fields) {
        if (field.required && !values[field.name]) {
          message = t('common.required', { field: field.label });
          break;
        }
      }
      message ??= options.validate?.(values) ?? null;

      if (message) {
        error.textContent = message;
        error.hidden = false;
        return;
      }
      result = values;
      dialog.close();
    });
    cancel.addEventListener('click', () => dialog.close());
    // Fires on submit, cancel and Esc
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });

    document.body.append(dialog);
    dialog.showModal();
  });
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
}

/** Shows a modal confirmation. Resolves with true only when confirmed. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'dialog' });
    const cancel = el('button', { class: 'btn', text: t('common.cancel'), attrs: { type: 'button' } });
    const confirm = el('button', { class: 'btn danger', text: options.confirmLabel, attrs: { type: 'button' } });
    dialog.append(
      el('div', { class: 'dialog-form' }, [
        el('h3', { class: 'dialog-title', text: options.title }),
        el('p', { class: 'muted', text: options.message }),
        el('div', { class: 'dialog-buttons' }, [cancel, confirm]),
      ]),
    );

    let confirmed = false;
    confirm.addEventListener('click', () => {
      confirmed = true;
      dialog.close();
    });
    cancel.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(confirmed);
    });

    document.body.append(dialog);
    dialog.showModal();
  });
}

export interface ContentDialogOptions {
  title: string;
  content: Node;
  /** Extra buttons. A "Close" button is always added. */
  actions: { label: string; value: string; variant?: 'primary' | 'danger' }[];
}

/** Shows read-only content in a modal. Resolves with the value of the clicked action, or null on close. */
export function openContentDialog(options: ContentDialogOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'dialog wide' });
    let result: string | null = null;

    const buttons = el('div', { class: 'dialog-buttons' });
    const close = el('button', { class: 'btn', text: t('common.close'), attrs: { type: 'button' } });
    close.addEventListener('click', () => dialog.close());
    buttons.append(close);
    for (const action of options.actions) {
      const button = el('button', {
        class: action.variant ? `btn ${action.variant}` : 'btn',
        text: action.label,
        attrs: { type: 'button' },
      });
      button.addEventListener('click', () => {
        result = action.value;
        dialog.close();
      });
      buttons.append(button);
    }

    dialog.append(
      el('div', { class: 'dialog-form' }, [
        el('h3', { class: 'dialog-title', text: options.title }),
        el('div', { class: 'dialog-content' }, [options.content]),
        buttons,
      ]),
    );
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });

    document.body.append(dialog);
    dialog.showModal();
  });
}
