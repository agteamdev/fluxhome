import { el } from './dom';

export interface FormField {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  /** Input type for single-line fields (default "text"). */
  type?: 'text' | 'date';
  /** Renders a multi-line <textarea>. */
  multiline?: boolean;
  rows?: number;
  /** Renders a <select> with these options. */
  options?: { value: string; label: string }[];
}

export interface FormDialogOptions {
  title: string;
  submitLabel: string;
  fields: FormField[];
  /** Return an error message to block submitting, or null when the values are fine. */
  validate?: (values: Record<string, string>) => string | null;
}

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function createControl(field: FormField): Control {
  if (field.options) {
    const select = el('select', { attrs: { name: field.name } });
    for (const option of field.options) {
      select.append(el('option', { text: option.label, attrs: { value: option.value } }));
    }
    select.value = field.value ?? field.options[0]!.value;
    return select;
  }
  if (field.multiline) {
    const area = el('textarea', { attrs: { name: field.name, rows: String(field.rows ?? 8) } });
    area.value = field.value ?? '';
    if (field.placeholder) area.placeholder = field.placeholder;
    return area;
  }
  const input = el('input', { attrs: { type: field.type ?? 'text', name: field.name, autocomplete: 'off' } });
  input.value = field.value ?? '';
  if (field.placeholder) input.placeholder = field.placeholder;
  return input;
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
      form.append(el('label', { class: 'dialog-field' }, [el('span', { text: field.label }), control]));
    }

    const cancel = el('button', { class: 'btn', text: 'Cancel', attrs: { type: 'button' } });
    const submit = el('button', { class: 'btn primary', text: options.submitLabel, attrs: { type: 'submit' } });
    form.append(error, el('div', { class: 'dialog-buttons' }, [cancel, submit]));
    dialog.append(form);

    let result: Record<string, string> | null = null;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values: Record<string, string> = {};
      for (const [name, control] of controls) values[name] = control.value.trim();

      let message: string | null = null;
      for (const field of options.fields) {
        if (field.required && !values[field.name]) {
          message = `${field.label} is required`;
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
    const cancel = el('button', { class: 'btn', text: 'Cancel', attrs: { type: 'button' } });
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
    const close = el('button', { class: 'btn', text: 'Close', attrs: { type: 'button' } });
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
