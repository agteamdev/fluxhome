import { el } from './dom';

/** Small non-blocking message at the bottom of the page. */
export function showToast(message: string, kind: 'success' | 'error' = 'success'): void {
  let container = document.querySelector<HTMLElement>('.toast-container');
  if (!container) {
    container = el('div', { class: 'toast-container', attrs: { role: 'status', 'aria-live': 'polite' } });
    document.body.append(container);
  }
  const toast = el('div', { class: `toast ${kind}`, text: message });
  container.append(toast);
  setTimeout(() => toast.remove(), kind === 'error' ? 8000 : 4000);
}
