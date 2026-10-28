import { describe, expect, it } from 'vitest';
import { BACKGROUND_PRESETS, CARD_OPACITY_CHOICES, findPreset, nearestCardOpacity, resolveBackground } from './settings';

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
