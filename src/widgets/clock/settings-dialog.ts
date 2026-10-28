import { el } from '@/components/dom';
import { createSelect, type SelectItem } from '@/components/select';
import {
  filterZones,
  listTimeZones,
  MAX_ZONES,
  zoneLabel,
  zoneOffsetLabel,
  zoneRegion,
  type ClockOptions,
} from '@/lib/clock';
import { t } from '@/lib/i18n';

/**
 * Clock settings dialog: style, time format and a world clock picker.
 * The picker is a scrollable drop-down in the extension design, grouped by region, with a filter box.
 * It only offers time zones the browser supports, so every choice works.
 * Resolves with the new options, or null when cancelled.
 */
export function openClockSettings(current: ClockOptions): Promise<ClockOptions | null> {
  return new Promise((resolve) => {
    const allZones = listTimeZones();
    const now = new Date();
    const offsets = new Map<string, string>();
    const describe = (zone: string): string => {
      if (!offsets.has(zone)) offsets.set(zone, zoneOffsetLabel(zone, now));
      const offset = offsets.get(zone)!;
      return offset ? `${zoneLabel(zone)} (${offset})` : zoneLabel(zone);
    };

    let zones = [...current.zones];

    const dialog = el('dialog', { class: 'dialog' });
    const form = el('form', { class: 'dialog-form' });
    form.append(el('h3', { class: 'dialog-title', text: t('clock.settings') }));

    const mode = createSelect({
      ariaLabel: t('clock.style'),
      value: current.mode,
      items: [
        { value: 'digital', label: t('clock.digital') },
        { value: 'analog', label: t('clock.analog') },
      ],
    });
    const format = createSelect({
      ariaLabel: t('clock.format'),
      value: current.hour12 ? '12' : '24',
      items: [
        { value: '24', label: t('clock.h24') },
        { value: '12', label: t('clock.h12') },
      ],
    });
    form.append(
      el('label', { class: 'dialog-field' }, [el('span', { text: t('clock.style') }), mode.element]),
      el('label', { class: 'dialog-field' }, [el('span', { text: t('clock.format') }), format.element]),
    );

    // ---- world clocks ----
    const counter = el('span', { class: 'muted' });
    const chips = el('ul', { class: 'zone-chips' });

    const zoneItems = (): SelectItem[] =>
      allZones
        .filter((zone) => !zones.includes(zone))
        .map((zone) => ({ value: zone, label: describe(zone), group: zoneRegion(zone), title: zone }));

    const picker = createSelect({
      ariaLabel: t('clock.addZone'),
      placeholder: t('clock.addZone'),
      searchable: true,
      searchPlaceholder: t('clock.filterZone'),
      resetAfterSelect: true,
      items: zoneItems(),
      // Match on the zone name ("America/New_York"), not on the label, so "new york" and "kiev" work
      filter: (query, item) => filterZones([item.value], query).length > 0,
      onChange: (zone) => {
        if (!zone || zones.length >= MAX_ZONES || zones.includes(zone)) return;
        zones.push(zone);
        refresh();
      },
    });

    const refresh = (): void => {
      counter.textContent = t('clock.count', { count: zones.length, max: MAX_ZONES });
      picker.setItems(zoneItems());
      picker.disabled = zones.length >= MAX_ZONES;

      if (zones.length === 0) {
        chips.replaceChildren(el('li', { class: 'muted', text: t('clock.none') }));
        return;
      }
      chips.replaceChildren(
        ...zones.map((zone) => {
          const remove = el('button', {
            class: 'btn small',
            text: '✕',
            attrs: { type: 'button', title: t('clock.remove'), 'aria-label': t('clock.removeZone', { zone: zoneLabel(zone) }) },
          });
          remove.addEventListener('click', () => {
            zones = zones.filter((z) => z !== zone);
            refresh();
          });
          return el('li', { class: 'zone-chip' }, [el('span', { text: describe(zone), attrs: { title: zone } }), remove]);
        }),
      );
    };

    form.append(el('div', { class: 'dialog-field' }, [el('span', {}, [`${t('clock.world')} `, counter]), picker.element, chips]));
    refresh();

    const cancel = el('button', { class: 'btn', text: t('common.cancel'), attrs: { type: 'button' } });
    const save = el('button', { class: 'btn primary', text: t('common.save'), attrs: { type: 'submit' } });
    form.append(el('div', { class: 'dialog-buttons' }, [cancel, save]));
    dialog.append(form);

    let result: ClockOptions | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      result = { mode: mode.value === 'analog' ? 'analog' : 'digital', hour12: format.value === '12', zones };
      dialog.close();
    });
    cancel.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });

    document.body.append(dialog);
    dialog.showModal();
  });
}
