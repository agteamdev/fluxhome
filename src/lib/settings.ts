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
 * An uploaded picture wins, then a filled image URL (must be http(s)), then the chosen preset.
 */
export function resolveBackground(
  preset: Background | null,
  imageUrl: string,
  uploaded: string | null = null,
): { background: Background } | { error: string } {
  // A picture chosen from the computer wins over everything else
  if (uploaded) {
    return isBackgroundDataUrl(uploaded) ? { background: { type: 'image', value: uploaded } } : { error: 'settings.imageBad' };
  }
  const text = imageUrl.trim();
  if (text) {
    const url = normalizeUrl(text);
    if (!url) return { error: 'settings.imageInvalid' };
    return { background: { type: 'image', value: url } };
  }
  return { background: preset ?? { type: 'solid', value: '' } };
}

export const MAX_COLUMNS = 4;

/** Largest accepted picture from the computer, as characters of its data URL (about 2.2 MB of image). */
export const MAX_BACKGROUND_CHARS = 3_000_000;

const BACKGROUND_DATA_URL = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** True for a picture stored in the settings (a small "data:" URL of a PNG, JPEG or WebP). */
export function isBackgroundDataUrl(value: string): boolean {
  return value.length <= MAX_BACKGROUND_CHARS && BACKGROUND_DATA_URL.test(value);
}

const DEFAULT_BACKGROUND: Background = { type: 'solid', value: '' };

/**
 * Checks a background that comes from outside (an imported file) and returns a safe one.
 * Only plain colors, plain linear gradients (no url()) and pictures (http(s) address or small data URL) are accepted.
 */
export function sanitizeBackground(type: unknown, value: unknown): Background {
  const text = typeof value === 'string' ? value : '';
  if (type === 'solid') return /^(#[0-9a-fA-F]{3,8})?$/.test(text) ? { type, value: text } : DEFAULT_BACKGROUND;
  if (type === 'gradient') {
    return /^linear-gradient\([^;{}]{1,200}\)$/.test(text) && !/url\s*\(/i.test(text) ? { type, value: text } : DEFAULT_BACKGROUND;
  }
  if (type === 'image') {
    if (isBackgroundDataUrl(text)) return { type, value: text };
    const url = normalizeUrl(text);
    return url ? { type, value: url } : DEFAULT_BACKGROUND;
  }
  return DEFAULT_BACKGROUND;
}
