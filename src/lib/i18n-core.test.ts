import { describe, expect, it } from 'vitest';
import { createI18n } from './i18n-core';

const i18n = createI18n({
  en: { 'meta.name': 'English', hello: 'Hello', greet: 'Hi, {name}! You have {count} tasks.', onlyEn: 'Only English' },
  ru: { 'meta.name': 'Русский', hello: 'Привет', greet: 'Привет, {name}! Задач: {count}.' },
});

describe('translate', () => {
  it('translates and fills placeholders', () => {
    expect(i18n.translate('ru', 'hello')).toBe('Привет');
    expect(i18n.translate('en', 'greet', { name: 'Alex', count: 3 })).toBe('Hi, Alex! You have 3 tasks.');
  });
  it('falls back to English, then to the key', () => {
    expect(i18n.translate('ru', 'onlyEn')).toBe('Only English');
    expect(i18n.translate('ru', 'missing.key')).toBe('missing.key');
  });
  it('leaves unknown placeholders untouched', () => {
    expect(i18n.translate('en', 'greet', { name: 'Alex' })).toBe('Hi, Alex! You have {count} tasks.');
  });
});

describe('resolveLanguage', () => {
  it('uses an explicit supported language', () => {
    expect(i18n.resolveLanguage('ru', 'en-US')).toBe('ru');
  });
  it('follows the browser language when set to auto', () => {
    expect(i18n.resolveLanguage('auto', 'ru-RU')).toBe('ru');
    expect(i18n.resolveLanguage('auto', 'RU')).toBe('ru');
  });
  it('falls back to English for unknown languages', () => {
    expect(i18n.resolveLanguage('auto', 'de-DE')).toBe('en');
    expect(i18n.resolveLanguage('xx', 'de')).toBe('en');
  });
});

describe('locales', () => {
  it('lists languages with their own names', () => {
    expect(i18n.locales().map((l) => l.code).sort()).toEqual(['en', 'ru']);
    expect(i18n.locales().find((l) => l.code === 'ru')!.name).toBe('Русский');
  });
});
