import { el } from './dom';

export interface FormField {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
}

export interface FormDialogOptions {
  title: string;
  submitLabel: string;
  fields: FormField[];
  /** Return an error message to block submitting, or null when the values are fine. */
  validate?: (values: Record<string, string>) => string | null;
}

/** Shows a modal form. Resolves with the (trimmed) values, or null when cancelled. */
export function openFormDialog(options: FormDialogOptions): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    const dialog = el('dialog', { class: 'dialog' });
    const form = el('form', { class: 'dialog-form' });
    const error = el('p', { class: 'dialog-error' });
    error.hidden = true;
    const inputs = new Map<string, HTMLInputElement>();

    form.append(el('h3', { class: 'dialog-title', text: options.title }));
    for (const field of options.fields) {
      const input = el('input', { attrs: { type: 'text', name: field.name, autocomplete: 'off' } });
      input.value = field.value ?? '';
      if (field.placeholder) input.placeholder = field.placeholder;
      inputs.set(field.name, input);
      form.append(el('label', { class: 'dialog-field' }, [el('span', { text: field.label }), input]));
    }

    const cancel = el('button', { class: 'btn', text: 'Cancel', attrs: { type: 'button' } });
    const submit = el('button', { class: 'btn primary', text: options.submitLabel, attrs: { type: 'submit' } });
    form.append(error, el('div', { class: 'dialog-buttons' }, [cancel, submit]));
    dialog.append(form);

    let result: Record<string, string> | null = null;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values: Record<string, string> = {};
      for (const [name, input] of inputs) values[name] = input.value.trim();

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
