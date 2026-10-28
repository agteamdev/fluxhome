import { el } from './dom';
import { t } from '@/lib/i18n';
import { BACKGROUND_PRESETS } from '@/lib/settings';
import type { Background } from '@/lib/types';

export interface SwatchPicker {
  element: HTMLElement;
  /** The chosen preset background, or null when nothing is selected. */
  value: Background | null;
  onChange?: () => void;
}

/** A grid of background presets (solid colors and gradients) in the extension design. */
export function createSwatchPicker(initial: Background | null): SwatchPicker {
  let selected: Background | null = initial;
  const buttons = new Map<string, HTMLButtonElement>();
  const grid = el('div', { class: 'swatches', attrs: { role: 'radiogroup', 'aria-label': t('bg.title') } });

  const matches = (a: Background | null, b: Background): boolean => a !== null && a.type === b.type && a.value === b.value;

  const refresh = (): void => {
    for (const preset of BACKGROUND_PRESETS) {
      const on = matches(selected, preset.background);
      const button = buttons.get(preset.id)!;
      button.classList.toggle('on', on);
      button.setAttribute('aria-checked', String(on));
    }
  };

  const picker: SwatchPicker = {
    element: grid,
    get value() {
      return selected;
    },
    set value(next: Background | null) {
      selected = next;
      refresh();
    },
  };

  for (const preset of BACKGROUND_PRESETS) {
    const button = el('button', {
      class: preset.id === 'default' ? 'swatch default' : 'swatch',
      attrs: { type: 'button', role: 'radio', title: t(preset.labelKey), 'aria-label': t(preset.labelKey) },
    });
    const { type, value } = preset.background;
    if (value) {
      if (type === 'gradient') button.style.backgroundImage = value;
      else button.style.backgroundColor = value;
    }
    button.addEventListener('click', () => {
      selected = preset.background;
      refresh();
      picker.onChange?.();
    });
    buttons.set(preset.id, button);
    grid.append(button);
  }
  refresh();
  return picker;
}
