import { el } from '@/components/dom';
import type { Page } from '@/lib/types';

/** Bookmarks widget (stage 2: display only; CRUD arrives in stage 3). */
export function renderBookmarksWidget(page: Page): HTMLElement {
  const root = el('section', { class: 'widget' }, [el('h2', { class: 'widget-title', text: 'Bookmarks' })]);

  if (page.groups.length === 0) {
    root.append(el('p', { class: 'muted', text: 'No groups yet' }));
    return root;
  }

  const tabs = el('div', { class: 'tabs' });
  const list = el('ul', { class: 'links' });
  root.append(tabs, list);

  let activeIndex = 0;

  const draw = () => {
    tabs.replaceChildren();
    page.groups.forEach((group, i) => {
      const btn = el('button', {
        class: i === activeIndex ? 'tab active' : 'tab',
        text: group.title,
        attrs: { type: 'button' },
      });
      btn.addEventListener('click', () => {
        activeIndex = i;
        draw();
      });
      tabs.append(btn);
    });

    list.replaceChildren();
    const group = page.groups[activeIndex]!;
    if (group.bookmarks.length === 0) {
      list.append(el('li', { class: 'muted', text: 'This group is empty' }));
    }
    for (const b of group.bookmarks) {
      const letter = (b.title.trim()[0] ?? '?').toUpperCase();
      const a = el('a', { attrs: { href: b.url, title: b.url } }, [
        el('span', { class: 'ico', text: letter }),
        el('span', { text: b.title }),
      ]);
      list.append(el('li', {}, [a]));
    }
  };

  draw();
  return root;
}
