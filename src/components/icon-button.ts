import { el } from './dom';
import { icon, type IconName } from './icons';

/**
 * A small monochrome icon button without a background plate. It uses the text color of the theme,
 * so it looks right on any card, background and transparency.
 */
export function iconButton(name: IconName, label: string, onClick: () => void, extraClass = ''): HTMLButtonElement {
  const button = el('button', { class: extraClass ? `icon-action ${extraClass}` : 'icon-action', attrs: { type: 'button', title: label, 'aria-label': label } });
  button.append(icon(name));
  button.addEventListener('click', onClick);
  return button;
}
