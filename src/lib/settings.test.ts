import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_PRESETS,
  CARD_OPACITY_CHOICES,
  findPreset,
  isBackgroundDataUrl,
  MAX_BACKGROUND_CHARS,
  nearestCardOpacity,
  resolveBackground,
  sanitizeBackground,
} from './settings';

describe('background presets', () => {
  it('starts with the default (empty) background', () => {
    expect(BACKGROUND_PRESETS[0]!.background).toEqual({ type: 'solid', value: '' });
  });
  it('has unique ids', () => {
    expect(new Set(BACKGROUND_PRESETS.map((p) => p.id)).size).toBe(BACKGROUND_PRESETS.length);
  });
  it('finds a preset by its background', () => {
    const preset = BACKGROUND_PRESETS.find((p) => p.id === 'violet')!;
    expect(findPreset(preset.background)?.id).toBe('violet');
    expect(findPreset({ type: 'solid', value: '#123456' })).toBe(undefined);
  });
});

describe('resolveBackground', () => {
  const slate = { type: 'solid' as const, value: '#1e293b' };
  it('uses the preset when there is no image URL', () => {
    expect(resolveBackground(slate, '  ')).toEqual({ background: slate });
  });
  it('falls back to the default when nothing is chosen', () => {
    expect(resolveBackground(null, '')).toEqual({ background: { type: 'solid', value: '' } });
  });
  it('lets an image URL win and normalizes it', () => {
    expect(resolveBackground(slate, 'example.com/bg.jpg')).toEqual({
      background: { type: 'image', value: 'https://example.com/bg.jpg' },
    });
  });
  it('rejects unsafe image URLs', () => {
    expect(resolveBackground(slate, 'javascript:alert(1)')).toEqual({ error: 'settings.imageInvalid' });
  });
});

describe('presets and card choices', () => {
  it('every preset has a translation key', () => {
    expect(BACKGROUND_PRESETS.every((p) => p.labelKey === `bg.${p.id}`)).toBe(true);
  });
  it('finds the nearest card opacity', () => {
    expect(nearestCardOpacity(1)).toBe(1);
    expect(nearestCardOpacity(0.7)).toBe(0.75);
    expect(nearestCardOpacity(0.3)).toBe(0.45);
    expect(nearestCardOpacity(0)).toBe(0);
    expect(CARD_OPACITY_CHOICES).toHaveLength(4);
  });
});

describe('uploaded pictures', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  it('recognizes small picture data URLs only', () => {
    expect(isBackgroundDataUrl(png)).toBe(true);
    expect(isBackgroundDataUrl('data:image/svg+xml;base64,AAAA')).toBe(false);
    expect(isBackgroundDataUrl('data:text/html;base64,AAAA')).toBe(false);
    expect(isBackgroundDataUrl('https://example.com/a.png')).toBe(false);
    expect(isBackgroundDataUrl('data:image/png;base64,' + 'A'.repeat(MAX_BACKGROUND_CHARS))).toBe(false);
  });
  it('an uploaded picture wins over a preset and an address', () => {
    const slate = { type: 'solid' as const, value: '#1e293b' };
    expect(resolveBackground(slate, 'example.com/a.jpg', png)).toEqual({ background: { type: 'image', value: png } });
  });
  it('rejects an invalid uploaded picture', () => {
    expect(resolveBackground(null, '', 'data:text/html;base64,AAAA')).toEqual({ error: 'settings.imageBad' });
  });
});

describe('sanitizeBackground', () => {
  const none = { type: 'solid', value: '' };
  it('keeps presets', () => {
    for (const preset of BACKGROUND_PRESETS) expect(sanitizeBackground(preset.background.type, preset.background.value)).toEqual(preset.background);
  });
  it('keeps pictures: data URLs and web addresses', () => {
    expect(sanitizeBackground('image', 'data:image/jpeg;base64,/9j/4AAQ')).toEqual({ type: 'image', value: 'data:image/jpeg;base64,/9j/4AAQ' });
    expect(sanitizeBackground('image', 'example.com/a.jpg')).toEqual({ type: 'image', value: 'https://example.com/a.jpg' });
  });
  it('drops anything that could load or run something unexpected', () => {
    expect(sanitizeBackground('image', 'javascript:alert(1)')).toEqual(none);
    expect(sanitizeBackground('gradient', 'linear-gradient(red, url(https://tracker.test/x.png))')).toEqual(none);
    expect(sanitizeBackground('gradient', 'url(https://tracker.test/x.png)')).toEqual(none);
    expect(sanitizeBackground('solid', 'red; background: url(x)')).toEqual(none);
    expect(sanitizeBackground('weird', '#fff')).toEqual(none);
    expect(sanitizeBackground('solid', 5)).toEqual(none);
  });
});
