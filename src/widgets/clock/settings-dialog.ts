import { el } from '@/components/dom';
import {
  filterZones,
  groupZones,
  listTimeZones,
  MAX_ZONES,
  zoneLabel,
  zoneOffsetLabel,
  type ClockOptions,
} from '@/lib/clock';

/**
 * Clock settings dialog: style, time format and a world clock picker.
 * The picker is a scrollable drop-down grouped by region with a filter box;
 * it only offers time zones the browser supports, so every choice works.
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

    const select = (label: string, name: string, value: string, options: { value: string; label: string }[]) => {
      const control = el('select', { attrs: { name } });
      for (const o of options) control.append(el('option', { text: o.label, attrs: { value: o.value } }));
      control.value = value;
      form.append(el('label', { class: 'dialog-field' }, [el('span', { text: label }), control]));
      return control;
    };

    form.append(el('h3', { class: 'dialog-title', text: 'Clock settings' }));
    const mode = select('Style', 'mode', current.mode, [
      { value: 'digital', label: 'Digital' },
      { value: 'analog', label: 'Analog' },
    ]);
    const format = select('Time format', 'format', current.hour12 ? '12' : '24', [
      { value: '24', label: '24-hour' },
      { value: '12', label: '12-hour (AM/PM)' },
    ]);

    // ---- world clocks ----
    const filter = el('input', {
      attrs: { type: 'search', placeholder: 'Filter, e.g. “new york”', autocomplete: 'off', 'aria-label': 'Filter time zones' },
    });
    const picker = el('select', { attrs: { 'aria-label': 'Add a time zone' } });
    const counter = el('span', { class: 'muted' });
    const chips = el('ul', { class: 'zone-chips' });

    const fillPicker = (): void => {
      picker.replaceChildren(el('option', { text: 'Add a time zone…', attrs: { value: '' } }));
      const matches = filterZones(allZones, filter.value).filter((z) => !zones.includes(z));
      if (matches.length === 0) {
        picker.append(el('option', { text: 'No matching time zones', attrs: { value: '', disabled: '' } }));
      }
      for (const group of groupZones(matches)) {
        const optgroup = el('optgroup', { attrs: { label: group.region } });
        for (const zone of group.zones) {
          optgroup.append(el('option', { text: describe(zone), attrs: { value: zone, title: zone } }));
        }
        picker.append(optgroup);
      }
      picker.value = '';
      picker.disabled = zones.length >= MAX_ZONES;
    };

    const renderChips = (): void => {
      counter.textContent = `${zones.length} of ${MAX_ZONES}`;
      if (zones.length === 0) {
        chips.replaceChildren(el('li', { class: 'muted', text: 'No world clocks yet' }));
        return;
      }
      chips.replaceChildren(
        ...zones.map((zone) => {
          const remove = el('button', {
            class: 'btn small',
            text: '✕',
            attrs: { type: 'button', title: 'Remove', 'aria-label': `Remove ${zoneLabel(zone)}` },
          });
          remove.addEventListener('click', () => {
            zones = zones.filter((z) => z !== zone);
            renderChips();
            fillPicker();
          });
          return el('li', { class: 'zone-chip' }, [el('span', { text: describe(zone), attrs: { title: zone } }), remove]);
        }),
      );
    };

    const addZone = (zone: string): void => {
      if (!zone || zones.length >= MAX_ZONES || zones.includes(zone)) return;
      zones.push(zone);
      renderChips();
      fillPicker();
    };

    filter.addEventListener('input', fillPicker);
    // Enter in the filter box adds the first match instead of submitting the form
    filter.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      addZone(picker.querySelector<HTMLOptionElement>('optgroup option')?.value ?? '');
    });
    picker.addEventListener('change', () => addZone(picker.value));

    form.append(
      el('div', { class: 'dialog-field' }, [
        el('span', {}, ['World clocks ', counter]),
        filter,
        picker,
        chips,
      ]),
    );
    renderChips();
    fillPicker();

    const cancel = el('button', { class: 'btn', text: 'Cancel', attrs: { type: 'button' } });
    const save = el('button', { class: 'btn primary', text: 'Save', attrs: { type: 'submit' } });
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
