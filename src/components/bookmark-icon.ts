import { el } from './dom';
import type { Bookmark } from '@/lib/types';

/** The small icon of a bookmark: the site icon when available and enabled, otherwise its first letter. */
export function bookmarkIcon(bookmark: Bookmark, useSiteIcons: boolean): HTMLElement {
  const letter = (bookmark.title.trim()[0] ?? '?').toUpperCase();
  const fallback = (): HTMLElement => el('span', { class: 'ico', text: letter });

  if (useSiteIcons && bookmark.favicon) {
    const image = el('img', { class: 'ico ico-img', attrs: { src: bookmark.favicon, alt: '', draggable: 'false' } });
    image.addEventListener('error', () => image.replaceWith(fallback()));
    return image;
  }
  return fallback();
}
