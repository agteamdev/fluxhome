import { el } from './dom';
import { openPopup, type PopupHandle } from './popup';
import {
  buildMonthGrid,
  cellValue,
  monthLabel,
  parseValue,
  shiftMonth,
  weekdayLabels,
} from '@/utils/calendar';
import { locale, t } from '@/lib/i18n';
import { formatDateInput } from '@/utils/date';

export interface DatePickerOptions {
  /** "YYYY-MM-DD" or "" for no date. */
  value?: string;
  placeholder?: string;
  ariaLabel?: string;
  onChange?: (value: string) => void;
}

export interface DatePickerControl {
  element: HTMLButtonElement;
  /** "YYYY-MM-DD" or "". */
  value: string;
}

const WEEK_START = 1; // Monday

/** A calendar drop-down that matches the extension design (the browser's own date popup cannot be styled). */
export function createDatePicker(options: DatePickerOptions): DatePickerControl {
  let value = options.value && parseValue(options.value) ? options.value : '';
  let handle: PopupHandle | null = null;

  const label = el('span', { class: 'select-label' });
  const trigger = el('button', { class: 'select', attrs: { type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' } }, [
    label,
    el('span', { class: 'select-chevron', text: '▾', attrs: { 'aria-hidden': 'true' } }),
  ]);
  if (options.ariaLabel) trigger.setAttribute('aria-label', options.ariaLabel);

  const refreshLabel = (): void => {
    const parsed = parseValue(value);
    label.textContent = parsed
      ? new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' })
      : (options.placeholder ?? t('common.noDate'));
    label.classList.toggle('placeholder', !parsed);
  };

  const open = (): void => {
    if (handle || trigger.disabled) return;

    const today = new Date();
    const todayValue = formatDateInput(today.getTime());
    const start = parseValue(value) ?? { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
    let view = { year: start.year, month: start.month };
    let focusValue = value || todayValue;

    const title = el('div', { class: 'cal-title', attrs: { 'aria-live': 'polite' } });
    const grid = el('div', { class: 'cal-grid', attrs: { role: 'grid' } });
    const prev = el('button', { class: 'btn small', text: '‹', attrs: { type: 'button', 'aria-label': t('cal.prev') } });
    const next = el('button', { class: 'btn small', text: '›', attrs: { type: 'button', 'aria-label': t('cal.next') } });
    const todayButton = el('button', { class: 'btn small', text: t('cal.today'), attrs: { type: 'button' } });
    const clearButton = el('button', { class: 'btn small', text: t('common.clear'), attrs: { type: 'button' } });
    const weekdays = el(
      'div',
      { class: 'cal-grid cal-weekdays', attrs: { 'aria-hidden': 'true' } },
      weekdayLabels(WEEK_START, locale()).map((name) => el('span', { text: name })),
    );
    const popup = el('div', { class: 'calendar' }, [
      el('div', { class: 'cal-header' }, [prev, title, next]),
      weekdays,
      grid,
      el('div', { class: 'cal-footer' }, [todayButton, clearButton]),
    ]);

    const pick = (chosen: string): void => {
      value = chosen;
      refreshLabel();
      handle?.close();
      trigger.focus();
      options.onChange?.(value);
    };

    const render = (focusButton: boolean): void => {
      title.textContent = monthLabel(view.year, view.month, locale());
      grid.replaceChildren();
      const cells = buildMonthGrid(view.year, view.month, WEEK_START);
      // Roving tab stop: only one day button is reachable with Tab, arrows move between days
      const tabStop = cells.some((c) => cellValue(c) === focusValue) ? focusValue : cellValue(cells.find((c) => c.inMonth)!);
      for (const cell of cells) {
        const cellVal = cellValue(cell);
        const classes = ['cal-day'];
        if (!cell.inMonth) classes.push('out');
        if (cellVal === todayValue) classes.push('today');
        if (cellVal === value) classes.push('sel');
        const button = el('button', {
          class: classes.join(' '),
          text: String(cell.day),
          attrs: { type: 'button', tabindex: cellVal === tabStop ? '0' : '-1', 'data-value': cellVal, 'aria-pressed': String(cellVal === value) },
        });
        button.addEventListener('click', () => pick(cellVal));
        grid.append(button);
      }
      if (focusButton) grid.querySelector<HTMLElement>(`[data-value="${focusValue}"]`)?.focus({ preventScroll: true });
    };

    const moveFocus = (days: number): void => {
      const current = parseValue(focusValue)!;
      const d = new Date(current.year, current.month, current.day + days);
      focusValue = formatDateInput(d.getTime());
      view = { year: d.getFullYear(), month: d.getMonth() };
      render(true);
    };

    grid.addEventListener('keydown', (event) => {
      const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
      const days = step[event.key];
      if (days === undefined) return;
      event.preventDefault();
      const focused = (document.activeElement as HTMLElement | null)?.dataset.value;
      if (focused) focusValue = focused;
      moveFocus(days);
    });

    prev.addEventListener('click', () => {
      view = shiftMonth(view.year, view.month, -1);
      render(false);
    });
    next.addEventListener('click', () => {
      view = shiftMonth(view.year, view.month, 1);
      render(false);
    });
    todayButton.addEventListener('click', () => pick(todayValue));
    clearButton.addEventListener('click', () => pick(''));

    render(false);
    trigger.setAttribute('aria-expanded', 'true');
    handle = openPopup(trigger, popup, () => {
      handle = null;
      trigger.setAttribute('aria-expanded', 'false');
    });
    grid.querySelector<HTMLElement>('[tabindex="0"]')?.focus({ preventScroll: true });
  };

  trigger.addEventListener('click', () => (handle ? handle.close() : open()));
  refreshLabel();

  return {
    element: trigger,
    get value() {
      return value;
    },
    set value(next: string) {
      value = parseValue(next) ? next : '';
      refreshLabel();
    },
  };
}

