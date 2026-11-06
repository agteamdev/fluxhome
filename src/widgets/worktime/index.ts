import { openFormDialog } from '@/components/dialog';
import { el } from '@/components/dom';
import { iconButton } from '@/components/icon-button';
import { roundButton } from '@/components/round-button';
import { widgetFrame } from '@/components/widget-frame';
import { t } from '@/lib/i18n';
import { saveFinishedSession, setActiveTracker, updateTimeEntries } from '@/lib/list-store';
import {
  deleteEntry,
  entriesForDay,
  entryDuration,
  finishTracker,
  formatDuration,
  isPaused,
  pauseTracker,
  recentLabels,
  renameEntry,
  resumeTracker,
  startTracker,
  totals,
  trackerElapsed,
} from '@/lib/timers-ops';
import type { ActiveTracker, TimeEntry, WidgetConfig } from '@/lib/types';
import { formatTimeInput, startOfDay } from '@/utils/date';
import { uid } from '@/utils/id';

const MAX_LISTED = 6;

/**
 * Work time widget: press play when you start a task, pause when you step away, stop when you finish.
 * Finished sessions are listed with the totals for today and for the last 7 days.
 */
export function renderWorkTimeWidget(widget: WidgetConfig, entries: TimeEntry[], active: ActiveTracker | null): HTMLElement {
  const { root, body } = widgetFrame(widget, t('work.title'));
  const now = Date.now();
  const tick: (() => void)[] = [];

  async function onStart(label: string): Promise<void> {
    await setActiveTracker(startTracker(label, Date.now()));
  }

  async function onStop(): Promise<void> {
    if (!active) return;
    await saveFinishedSession(finishTracker(active, Date.now(), uid(), t('work.untitled')));
  }

  async function onTogglePause(): Promise<void> {
    if (!active) return;
    await setActiveTracker(isPaused(active) ? resumeTracker(active, Date.now()) : pauseTracker(active, Date.now()));
  }

  async function onRename(entry: TimeEntry): Promise<void> {
    const values = await openFormDialog({
      title: t('work.rename'),
      submitLabel: t('common.save'),
      fields: [{ name: 'label', label: t('work.label'), value: entry.label, required: true }],
    });
    if (values) await updateTimeEntries((list) => renameEntry(list, entry.id, values.label!.slice(0, 200)));
  }

  // ---- the session that is running (or the form that starts one) ----
  if (active) {
    const paused = isPaused(active);
    const elapsed = el('div', { class: paused ? 'tracker-elapsed paused' : 'tracker-elapsed' });
    // The row has a fixed height, so the "Paused" tag does not push the rest of the widget down
    const labelRow = el('div', { class: 'tracker-label' }, [el('span', { class: 'tracker-label-text', text: active.label || t('work.untitled') })]);
    if (paused) labelRow.append(el('span', { class: 'paused-pill', text: t('work.paused') }));

    const toggle = roundButton(paused ? 'play' : 'pause', paused ? t('work.resume') : t('work.pause'));
    toggle.addEventListener('click', () => void onTogglePause());
    const stop = roundButton('stop', t('work.stop'));
    stop.addEventListener('click', () => void onStop());

    body.append(
      el('div', { class: 'tracker-running' }, [
        el('div', { class: 'tracker-info' }, [labelRow, elapsed]),
        el('div', { class: 'tracker-buttons' }, [toggle, stop]),
      ]),
    );
    tick.push(() => {
      elapsed.textContent = formatDuration(trackerElapsed(active, Date.now()));
    });
  } else {
    const input = el('input', {
      class: 'tracker-input',
      attrs: { type: 'text', placeholder: t('work.whatWork'), 'aria-label': t('work.whatWork'), autocomplete: 'off', maxlength: '200' },
    });
    const form = el('form', { class: 'tracker-form' }, [input, roundButton('play', t('work.start'), 'submit')]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void onStart(input.value);
    });
    body.append(form);

    const recent = recentLabels(entries, 3);
    if (recent.length > 0) {
      body.append(
        el(
          'div',
          { class: 'chip-row' },
          recent.map((label) => {
            const chip = el('button', { class: 'chip', text: label, attrs: { type: 'button', title: label } });
            chip.addEventListener('click', () => void onStart(label));
            return chip;
          }),
        ),
      );
    }
  }

  // ---- totals (they include the session that is running right now) ----
  const sums = totals(entries, now);
  const todayValue = el('strong');
  const weekValue = el('strong');
  body.append(
    el('div', { class: 'tracker-totals' }, [
      el('span', {}, [`${t('work.today')} `, todayValue]),
      el('span', {}, [`${t('work.week')} `, weekValue]),
    ]),
  );
  tick.push(() => {
    const time = Date.now();
    const running = active ? Math.min(trackerElapsed(active, time), time - startOfDay(time)) : 0;
    todayValue.textContent = formatDuration(sums.today + running, false);
    weekValue.textContent = formatDuration(sums.week + running, false);
  });

  // ---- today's sessions ----
  const today = entriesForDay(entries, now);
  if (today.length === 0) {
    // The hint is only for an empty day: not while a session is running
    if (!active) body.append(el('p', { class: 'muted', text: t('work.noEntries') }));
  } else {
    const list = el('ul', { class: 'entries' });
    for (const entry of today.slice(0, MAX_LISTED)) {
      const time = el('span', { class: 'entry-time', text: `${formatTimeInput(entry.start)}–${formatTimeInput(entry.end)}` });
      if (entry.pausedMs) {
        time.classList.add('has-pause');
        time.setAttribute('data-tip', t('work.pausedFor', { time: formatDuration(entry.pausedMs, false) }));
      }
      list.append(
        el('li', { class: 'entry' }, [
          el('div', { class: 'entry-main' }, [
            el('span', { class: 'entry-label', text: entry.label || t('work.untitled') }),
            time,
            el('span', { class: 'entry-duration', text: formatDuration(entryDuration(entry), false) }),
          ]),
          // Like in the other lists: the buttons float over the end of the row and do not move the record
          el('span', { class: 'row-actions' }, [
            iconButton('edit', t('work.rename'), () => void onRename(entry)),
            iconButton('delete', t('work.deleteEntry'), () => void updateTimeEntries((l) => deleteEntry(l, entry.id))),
          ]),
        ]),
      );
    }
    body.append(list);
  }

  // Refresh the running numbers every second; stop when this widget is no longer on the page
  const run = (): void => tick.forEach((fn) => fn());
  run();
  const timer = setInterval(() => {
    if (!root.isConnected) {
      clearInterval(timer);
      return;
    }
    run();
  }, 1000);

  return root;
}
