import { el } from './dom';
import { icon } from './icons';

/** A round button with an icon (play, pause, stop) used by the timers. */
export function roundButton(kind: 'play' | 'pause' | 'stop', label: string, type: 'button' | 'submit' = 'button'): HTMLButtonElement {
  const button = el('button', { class: `round-btn ${kind}`, attrs: { type, title: label, 'aria-label': label } });
  button.append(icon(kind, 16));
  return button;
}
