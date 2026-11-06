import { browser } from 'wxt/browser';
import { el } from '@/components/dom';
import { iconButton } from '@/components/icon-button';
import { roundButton } from '@/components/round-button';
import { showToast } from '@/components/toast';
import { widgetFrame } from '@/components/widget-frame';
import { t } from '@/lib/i18n';
import { setCountdown } from '@/lib/list-store';
import * as ops from '@/lib/page-ops';
import { updatePage } from '@/lib/page-store';
import { COUNTDOWN_ALARM, formatCountdown, isFinished, parseMinutes, remainingMs, startCountdown } from '@/lib/timers-ops';
import type { Countdown, Page, WidgetConfig } from '@/lib/types';
import { playBeep } from '@/utils/sound';

const PRESETS = [5, 10, 25, 45];

/** Countdowns that already beeped (so a redraw does not beep again). */
const alerted = new Set<number>();

/** Countdown timer: presets or your own minutes, a sound at the end and an optional notification. */
export function renderTimersWidget(widget: WidgetConfig, page: Page, countdown: Countdown | null): HTMLElement {
  const { root, body } = widgetFrame(widget, t('timer.title'));
  const notifyOn = widget.props.notify === true;

  async function saveNotify(value: boolean): Promise<void> {
    await updatePage(page.id, (p) => ops.updateWidgetProps(p, widget.id, { notify: value }));
  }

  async function onStart(minutes: number): Promise<void> {
    const next = startCountdown(minutes, Date.now(), '');
    await setCountdown(next);
    try {
      // A notification when the time is up, even if no FluxHome tab is open (only if the user allowed it)
      if (notifyOn && (await browser.permissions.contains({ permissions: ['alarms', 'notifications'] }))) {
        await browser.alarms.create(COUNTDOWN_ALARM, { when: next.end });
      }
    } catch {
      // Alarms are optional; the countdown still works while this page is open
    }
  }

  async function onCancel(): Promise<void> {
    await setCountdown(null);
    try {
      await browser.alarms?.clear(COUNTDOWN_ALARM);
    } catch {
      // Not available without permission: nothing to clear
    }
  }

  if (countdown) {
    const finished = isFinished(countdown, Date.now());
    const remaining = el('div', { class: 'countdown-remaining' });
    const fill = el('div', { class: 'countdown-fill' });
    body.append(
      el('div', { class: 'tracker-running' }, [
        el('div', { class: 'tracker-info' }, [remaining, el('div', { class: 'countdown-bar' }, [fill])]),
        iconButton('close', finished ? t('timer.dismiss') : t('timer.cancel'), () => void onCancel(), 'ghost-btn'),
      ]),
    );

    const update = (): void => {
      const time = Date.now();
      const left = remainingMs(countdown, time);
      remaining.textContent = left === 0 ? t('timer.timesUp') : formatCountdown(left);
      remaining.classList.toggle('done', left === 0);
      fill.style.width = `${Math.min(100, ((countdown.durationMs - left) / countdown.durationMs) * 100)}%`;
      // Beep once, and only when we see it end (not when the page is opened long after)
      if (left === 0 && !alerted.has(countdown.end) && time - countdown.end < 10_000) {
        alerted.add(countdown.end);
        playBeep();
        showToast(t('timer.timesUp'));
      }
    };
    update();
    // Refresh every second; stop when this widget is no longer on the page
    const timer = setInterval(() => {
      if (!root.isConnected) {
        clearInterval(timer);
        return;
      }
      update();
    }, 1000);
  } else {
    const chips = el(
      'div',
      { class: 'chip-row' },
      PRESETS.map((minutes) => {
        const chip = el('button', { class: 'chip', text: t('timer.minShort', { count: minutes }), attrs: { type: 'button' } });
        chip.addEventListener('click', () => void onStart(minutes));
        return chip;
      }),
    );
    const input = el('input', {
      class: 'minutes-input',
      attrs: { type: 'text', placeholder: t('timer.minutes'), 'aria-label': t('timer.minutes'), autocomplete: 'off', maxlength: '5' },
    });
    const bell = iconButton(
      notifyOn ? 'bell' : 'bellOff',
      notifyOn ? t('timer.notifyOn') : t('timer.notifyOff'),
      () => {
        if (notifyOn) {
          void saveNotify(false);
          return;
        }
        // The browser only shows its permission prompt for a call made directly inside a click
        const request = browser.permissions.request({ permissions: ['alarms', 'notifications'] }).catch(() => false);
        void (async () => {
          if (await request) await saveNotify(true);
          else showToast(t('timer.notifyDenied'), 'error');
        })();
      },
      'ghost-btn',
    );
    const form = el('form', { class: 'tracker-form' }, [input, roundButton('play', t('timer.startCountdown'), 'submit'), bell]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const minutes = parseMinutes(input.value);
      if (minutes === null) showToast(t('timer.badMinutes'), 'error');
      else void onStart(minutes);
    });
    body.append(chips, form);
  }

  return root;
}
