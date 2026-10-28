import { el } from './dom';
import { openPopup, type PopupHandle } from './popup';

export interface SelectItem {
  value: string;
  label: string;
  /** Items with the same group are listed under one heading (keep them next to each other). */
  group?: string;
  title?: string;
}

export interface SelectOptions {
  items: SelectItem[];
  value?: string;
  /** Shown when no item matches the current value. */
  placeholder?: string;
  ariaLabel?: string;
  /** Adds a filter box at the top of the list. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Custom matching for the filter box (default: label contains the text). */
  filter?: (query: string, item: SelectItem) => boolean;
  /** Act like an "add" menu: after choosing, the control goes back to the placeholder. */
  resetAfterSelect?: boolean;
  onChange?: (value: string) => void;
}

export interface SelectControl {
  element: HTMLButtonElement;
  value: string;
  disabled: boolean;
  setItems(items: SelectItem[]): void;
}

const defaultFilter = (query: string, item: SelectItem): boolean => item.label.toLowerCase().includes(query.toLowerCase());

/**
 * A drop-down that matches the extension design (the browser's own <select> list cannot be styled).
 * Keyboard: Enter / Space / arrows open it, arrows move, Enter chooses, Esc closes.
 */
export function createSelect(options: SelectOptions): SelectControl {
  let items = options.items;
  let value = options.value ?? (options.resetAfterSelect ? '' : (items[0]?.value ?? ''));
  let handle: PopupHandle | null = null;

  const label = el('span', { class: 'select-label' });
  const trigger = el('button', { class: 'select', attrs: { type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false' } }, [
    label,
    el('span', { class: 'select-chevron', text: '▾', attrs: { 'aria-hidden': 'true' } }),
  ]);
  if (options.ariaLabel) trigger.setAttribute('aria-label', options.ariaLabel);

  const refreshLabel = (): void => {
    const current = items.find((i) => i.value === value);
    label.textContent = current ? current.label : (options.placeholder ?? '');
    label.classList.toggle('placeholder', !current);
  };

  const open = (): void => {
    if (handle || trigger.disabled) return;

    let query = '';
    let visible: SelectItem[] = [];
    let active = -1;
    const list = el('ul', { class: 'select-list', attrs: { role: 'listbox' } });
    const search = options.searchable
      ? el('input', {
          class: 'select-search',
          attrs: { type: 'search', placeholder: options.searchPlaceholder ?? 'Filter…', autocomplete: 'off', 'aria-label': 'Filter' },
        })
      : null;
    const popup = el('div', { class: 'select-popup' }, search ? [search, list] : [list]);

    const optionEls = (): HTMLElement[] => Array.from(list.querySelectorAll<HTMLElement>('.select-option'));

    const setActive = (index: number): void => {
      active = index;
      optionEls().forEach((node, i) => node.classList.toggle('active', i === index));
      const node = optionEls()[index];
      if (!node) return;
      // Scroll inside the list only (scrollIntoView could also scroll the page and close the popup)
      if (node.offsetTop < list.scrollTop) list.scrollTop = node.offsetTop;
      else if (node.offsetTop + node.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = node.offsetTop + node.offsetHeight - list.clientHeight;
      }
    };

    const choose = (item: SelectItem): void => {
      if (!options.resetAfterSelect) value = item.value;
      refreshLabel();
      handle?.close();
      trigger.focus();
      options.onChange?.(item.value);
    };

    const render = (): void => {
      const match = options.filter ?? defaultFilter;
      visible = query ? items.filter((i) => match(query, i)) : items;
      list.replaceChildren();
      if (visible.length === 0) {
        list.append(el('li', { class: 'select-empty', text: 'No matches' }));
        active = -1;
        return;
      }
      let lastGroup: string | undefined;
      visible.forEach((item, index) => {
        if (item.group !== undefined && item.group !== lastGroup) {
          list.append(el('li', { class: 'select-group', text: item.group, attrs: { role: 'presentation' } }));
          lastGroup = item.group;
        }
        const selected = item.value === value;
        const row = el('li', {
          class: selected ? 'select-option selected' : 'select-option',
          text: item.label,
          attrs: { role: 'option', 'aria-selected': String(selected) },
        });
        if (item.title) row.title = item.title;
        row.addEventListener('pointerdown', (event) => event.preventDefault()); // keep the focus where it is
        row.addEventListener('click', () => choose(item));
        row.addEventListener('mousemove', () => {
          if (active !== index) setActive(index);
        });
        list.append(row);
      });
      const selectedIndex = visible.findIndex((i) => i.value === value);
      setActive(selectedIndex >= 0 ? selectedIndex : 0);
    };

    const onKey = (event: KeyboardEvent): void => {
      const count = visible.length;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (count > 0) setActive((active + (event.key === 'ArrowDown' ? 1 : -1) + count) % count);
      } else if (event.key === 'Home' || event.key === 'End') {
        if (search && event.target === search) return; // let the text cursor move
        event.preventDefault();
        if (count > 0) setActive(event.key === 'Home' ? 0 : count - 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const item = visible[active];
        if (item) choose(item);
      } else if (event.key === 'Tab') {
        handle?.close();
      }
    };

    render();
    trigger.setAttribute('aria-expanded', 'true');
    handle = openPopup(trigger, popup, () => {
      handle = null;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeEventListener('keydown', onKey);
    });

    if (search) {
      search.addEventListener('input', () => {
        query = search.value.trim();
        render();
        handle?.reposition();
      });
      search.addEventListener('keydown', onKey);
      search.focus({ preventScroll: true });
    } else {
      trigger.addEventListener('keydown', onKey);
    }
  };

  trigger.addEventListener('click', () => (handle ? handle.close() : open()));
  trigger.addEventListener('keydown', (event) => {
    if (!handle && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });

  refreshLabel();

  return {
    element: trigger,
    get value() {
      return value;
    },
    set value(next: string) {
      value = next;
      refreshLabel();
    },
    get disabled() {
      return trigger.disabled;
    },
    set disabled(next: boolean) {
      trigger.disabled = next;
    },
    setItems(next: SelectItem[]) {
      items = next;
      if (!options.resetAfterSelect && !items.some((i) => i.value === value)) value = items[0]?.value ?? '';
      refreshLabel();
    },
  };
}
