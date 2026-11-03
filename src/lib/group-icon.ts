import type { GroupIcon } from './types';

/** A small set of emojis offered in the group icon picker (any emoji can also be typed). */
export const EMOJI_CHOICES = [
  '🏠', '⭐', '💼', '📚', '🎓', '🎮', '🎵', '🎬', '📺', '🛒', '💰', '🏦', '✈️', '🚗', '🍳', '🍔', '☕', '🏋️', '❤️', '🩺',
  '🔧', '💻', '📱', '🌐', '📰', '📧', '💬', '👥', '🗓️', '📝', '📁', '🔒', '🧪', '🎨', '📷', '🌍', '⚽', '🎲', '🐱', '🌱',
] as const;

/** Largest accepted group picture, as characters of its "data:" URL (a 64x64 PNG is a few thousand). */
export const MAX_GROUP_ICON_CHARS = 60_000;

const PICTOGRAPH = /\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u0023\u002A\u0030-\u0039]\uFE0F?\u20E3/u;

/** True when the text is exactly one emoji (a single "character" as the user sees it, e.g. ❤️ or 🇨🇦). */
export function isSingleEmoji(text: string): boolean {
  const value = text.trim();
  if (!value || value.length > 24 || !PICTOGRAPH.test(value)) return false;
  const Segmenter = (Intl as unknown as { Segmenter?: new (locale: string, options: { granularity: string }) => { segment(input: string): Iterable<unknown> } }).Segmenter;
  if (!Segmenter) return true;
  return Array.from(new Segmenter('en', { granularity: 'grapheme' }).segment(value)).length === 1;
}

const ICON_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

/** Checks an icon that comes from storage or an imported file; returns a safe icon or undefined. */
export function sanitizeGroupIcon(raw: unknown): GroupIcon | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const { type, value } = raw as { type?: unknown; value?: unknown };
  if (typeof value !== 'string') return undefined;
  if (type === 'emoji' && isSingleEmoji(value)) return { type, value: value.trim() };
  if (type === 'image' && value.length <= MAX_GROUP_ICON_CHARS && ICON_DATA_URL.test(value)) return { type, value };
  return undefined;
}
