import { el } from '@/components/dom';
import { widgetFrame } from '@/components/widget-frame';
import {
  dayOffset,
  formatTime,
  getTimeParts,
  localTimeZone,
  parseClockOptions,
  zoneLabel,
} from '@/lib/clock';
import * as ops from '@/lib/page-ops';
import { updatePage } from '@/lib/page-store';
import type { Page, WidgetConfig } from '@/lib/types';
import { createAnalogClock } from './analog';
import { openClockSettings } from './settings-dialog';

/** Clock widget: digital or analog main clock plus optional world clocks. */
export function renderClockWidget(widget: WidgetConfig, page: Page): HTMLElement {
  const options = parseClockOptions(widget.props);
  const localZone = localTimeZone();

  const settings = el('button', {
    class: 'btn small',
    text: '⚙',
    attrs: { type: 'button', title: 'Clock settings', 'aria-label': 'Clock settings' },
  });
  settings.addEventListener('click', () => void onSettings());
  const { root, body } = widgetFrame(widget, 'Clock', [settings]);

  // ---- main clock ----
  const main = el('div', { class: 'clock-main' });
  const timeText = el('div', { class: 'clock-time' });
  const dateText = el('div', { class: 'clock-date' });
  const analog = options.mode === 'analog' ? createAnalogClock() : null;
  if (analog) main.append(analog.element);
  else main.append(timeText);
  main.append(dateText);
  body.append(main);

  // ---- world clocks ----
  const zoneRows = options.zones.map((zone) => {
    const time = el('span', { class: 'zone-time' });
    const note = el('span', { class: 'zone-note' });
    const row = el('li', { class: 'zone' }, [el('span', { class: 'zone-name', text: zoneLabel(zone) }), note, time]);
    return { zone, time, note, row };
  });
  if (zoneRows.length > 0) body.append(el('ul', { class: 'zones' }, zoneRows.map((r) => r.row)));

  const dateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  const update = (): void => {
    const now = new Date();
    if (analog) analog.update(getTimeParts(now, localZone));
    else timeText.textContent = formatTime(now, localZone, options.hour12, true);
    dateText.textContent = dateFormat.format(now);

    for (const { zone, time, note } of zoneRows) {
      time.textContent = formatTime(now, zone, options.hour12, false);
      const offset = dayOffset(now, zone, localZone);
      note.textContent = offset > 0 ? 'tomorrow' : offset < 0 ? 'yesterday' : '';
    }
  };
  update();

  // The page is rebuilt on every storage change, so stop ticking once this widget is gone
  const timer = setInterval(() => {
    if (!root.isConnected) {
      clearInterval(timer);
      return;
    }
    update();
  }, 1000);

  async function onSettings(): Promise<void> {
    const next = await openClockSettings(options);
    if (!next) return;
    await updatePage(page.id, (p) => ops.updateWidgetProps(p, widget.id, { ...next }));
  }

  return root;
}
