import { describe, expect, it } from 'vitest';
import { EMOJI_CHOICES, isSingleEmoji, MAX_GROUP_ICON_CHARS, sanitizeGroupIcon } from './group-icon';

describe('isSingleEmoji', () => {
  it('accepts one emoji, also complex ones', () => {
    expect(isSingleEmoji('🏠')).toBe(true);
    expect(isSingleEmoji('❤️')).toBe(true);
    expect(isSingleEmoji('🇨🇦')).toBe(true);
    expect(isSingleEmoji('👨‍👩‍👧')).toBe(true);
    expect(isSingleEmoji(' ⭐ ')).toBe(true);
  });
  it('rejects letters, several emojis and empty text', () => {
    expect(isSingleEmoji('a')).toBe(false);
    expect(isSingleEmoji('1')).toBe(false);
    expect(isSingleEmoji('🏠🏠')).toBe(false);
    expect(isSingleEmoji('')).toBe(false);
    expect(isSingleEmoji('<img>')).toBe(false);
  });
  it('every offered emoji is valid', () => {
    expect(EMOJI_CHOICES.every((e) => isSingleEmoji(e))).toBe(true);
  });
});

describe('sanitizeGroupIcon', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  it('keeps good icons', () => {
    expect(sanitizeGroupIcon({ type: 'emoji', value: '🏠' })).toEqual({ type: 'emoji', value: '🏠' });
    expect(sanitizeGroupIcon({ type: 'image', value: png })).toEqual({ type: 'image', value: png });
  });
  it('drops anything else', () => {
    expect(sanitizeGroupIcon(null)).toBe(undefined);
    expect(sanitizeGroupIcon({ type: 'emoji', value: 'hello' })).toBe(undefined);
    expect(sanitizeGroupIcon({ type: 'image', value: 'https://example.com/a.png' })).toBe(undefined);
    expect(sanitizeGroupIcon({ type: 'image', value: 'data:image/svg+xml;base64,AAAA' })).toBe(undefined);
    expect(sanitizeGroupIcon({ type: 'image', value: 'data:image/png;base64,' + 'A'.repeat(MAX_GROUP_ICON_CHARS) })).toBe(undefined);
    expect(sanitizeGroupIcon({ type: 'weird', value: '🏠' })).toBe(undefined);
  });
});
