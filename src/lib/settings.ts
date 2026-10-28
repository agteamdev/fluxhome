import type { Background } from './types';
import { normalizeUrl } from '@/utils/url';

/** Ready-made backgrounds offered in the settings (no native color picker needed). */
export interface BackgroundPreset {
  id: string;
  /** Translation key of the name (shown as a tooltip). */
  labelKey: string;
  background: Background;
}

const solid = (id: string, labelKey: string, value: string): BackgroundPreset => ({ id, labelKey, background: { type: 'solid', value } });
const gradient = (id: string, labelKey: string, from: string, to: string): BackgroundPreset => ({
  id,
  labelKey,
  background: { type: 'gradient', value: `linear-gradient(135deg, ${from}, ${to})` },
});

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  solid('default', 'bg.default', ''),
  solid('slate', 'bg.slate', '#1e293b'),
  solid('teal', 'bg.teal', '#0f3d3e'),
  solid('plum', 'bg.plum', '#3b2a4f'),
  solid('wine', 'bg.wine', '#4a1f2b'),
  solid('forest', 'bg.forest', '#1f3a2e'),
  solid('sand', 'bg.sand', '#f3e9dc'),
  solid('mist', 'bg.mist', '#e8eef7'),
  gradient('violet', 'bg.violet', '#667eea', '#764ba2'),
  gradient('ocean', 'bg.ocean', '#0ea5e9', '#6366f1'),
  gradient('sunset', 'bg.sunset', '#f093fb', '#f5576c'),
  gradient('mint', 'bg.mint', '#43e97b', '#38f9d7'),
  gradient('graphite', 'bg.graphite', '#232526', '#414345'),
  gradient('dawn', 'bg.dawn', '#fddb92', '#d1fdff'),
];

/** Levels of card transparency offered in the settings (translation key + opacity). */
export const CARD_OPACITY_CHOICES = [
  { value: 1, labelKey: 'card.solid' },
  { value: 0.75, labelKey: 'card.soft' },
  { value: 0.45, labelKey: 'card.glass' },
  { value: 0, labelKey: 'card.clear' },
] as const;

/** The offered level closest to an arbitrary opacity value. */
export function nearestCardOpacity(value: number): number {
  return CARD_OPACITY_CHOICES.reduce((best, c) => (Math.abs(c.value - value) < Math.abs(best - value) ? c.value : best), 1 as number);
}

/** The preset that equals the given background, if any. */
export function findPreset(background: Background): BackgroundPreset | undefined {
  return BACKGROUND_PRESETS.find((p) => p.background.type === background.type && p.background.value === background.value);
}

/**
 * Decides the final background from the dialog state. On failure `error` is a translation key.
 * A filled image URL wins over the chosen preset; the URL must be http(s).
 */
export function resolveBackground(preset: Background | null, imageUrl: string): { background: Background } | { error: string } {
  const text = imageUrl.trim();
  if (text) {
    const url = normalizeUrl(text);
    if (!url) return { error: 'settings.imageInvalid' };
    return { background: { type: 'image', value: url } };
  }
  return { background: preset ?? { type: 'solid', value: '' } };
}

export const MAX_COLUMNS = 4;
