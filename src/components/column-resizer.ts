import { el } from './dom';
import { t } from '@/lib/i18n';
import { MIN_COLUMN_SHARE } from '@/lib/page-ops';
import type { ColumnConfig } from '@/lib/types';

/** CSS grid template of the columns: '%' widths are shares of the free space (fr), 'px' widths are fixed. */
export function gridTemplate(columns: ColumnConfig[]): string {
  return columns.map((c) => (c.width.unit === 'px' ? `${c.width.value}px` : `minmax(0, ${c.width.value}fr)`)).join(' ');
}

/** After a keyboard resize the page is redrawn; this remembers which handle should get the focus back. */
let refocusIndex: number | null = null;

const KEY_STEP = 0.03;

/**
 * Adds a drag handle between every two neighbouring columns.
 * Dragging moves the border (the other columns stay put), double click makes the two columns equal,
 * and the arrow keys move the border when a handle has the focus.
 * `onResize` receives the ids of the two columns and the share (0..1) of their combined width for the left one.
 */
export function attachColumnResizers(
  grid: HTMLElement,
  columnEls: HTMLElement[],
  columns: ColumnConfig[],
  onResize: (leftId: string, rightId: string, leftShare: number) => void,
): void {
  const handles: { handle: HTMLElement; left: HTMLElement; right: HTMLElement }[] = [];

  const place = (): void => {
    for (const { handle, left, right } of handles) {
      const middle = (left.offsetLeft + left.offsetWidth + right.offsetLeft) / 2;
      handle.style.left = `${middle - 7}px`;
    }
  };

  for (let i = 0; i < columnEls.length - 1; i++) {
    const leftEl = columnEls[i]!;
    const rightEl = columnEls[i + 1]!;
    const left = columns[i]!;
    const right = columns[i + 1]!;
    if (left.width.unit !== '%' || right.width.unit !== '%') continue;

    const handle = el('div', {
      class: 'col-resizer',
      attrs: { role: 'separator', 'aria-orientation': 'vertical', tabindex: '0', title: t('page.resize'), 'aria-label': t('page.resize') },
    });
    handles.push({ handle, left: leftEl, right: rightEl });
    grid.append(handle);

    const currentShare = (): number => leftEl.offsetWidth / (leftEl.offsetWidth + rightEl.offsetWidth);

    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      handle.classList.add('active');
      const startX = event.clientX;
      const leftWidth = leftEl.offsetWidth;
      const total = leftWidth + rightEl.offsetWidth;
      const frTotal = left.width.value + right.width.value;
      let share = leftWidth / total;

      const move = (e: PointerEvent): void => {
        share = Math.min(1 - MIN_COLUMN_SHARE, Math.max(MIN_COLUMN_SHARE, (leftWidth + e.clientX - startX) / total));
        // Live preview; the result is saved (and the page redrawn) when the button is released
        grid.style.gridTemplateColumns = gridTemplate(
          columns.map((c, index) => (index === i ? { ...c, width: { ...c.width, value: frTotal * share } } : index === i + 1 ? { ...c, width: { ...c.width, value: frTotal * (1 - share) } } : c)),
        );
        place();
      };
      const finish = (): void => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', finish);
        handle.removeEventListener('pointercancel', finish);
        handle.classList.remove('active');
        onResize(left.id, right.id, share);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', finish);
      handle.addEventListener('pointercancel', finish);
    });

    handle.addEventListener('dblclick', () => onResize(left.id, right.id, 0.5));

    handle.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      refocusIndex = handles.length - 1;
      onResize(left.id, right.id, currentShare() + (event.key === 'ArrowRight' ? KEY_STEP : -KEY_STEP));
    });

    if (refocusIndex === handles.length - 1) {
      refocusIndex = null;
      setTimeout(() => handle.focus(), 0);
    }
  }

  if (handles.length > 0) new ResizeObserver(place).observe(grid);
}
