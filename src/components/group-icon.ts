import { el } from './dom';
import type { GroupIcon } from '@/lib/types';

/** The icon shown in front of a group name (an emoji or a small picture). */
export function groupIconElement(icon: GroupIcon): HTMLElement {
  if (icon.type === 'emoji') return el('span', { class: 'tab-icon', text: icon.value, attrs: { 'aria-hidden': 'true' } });
  return el('img', { class: 'tab-icon tab-icon-img', attrs: { src: icon.value, alt: '', draggable: 'false' } });
}
