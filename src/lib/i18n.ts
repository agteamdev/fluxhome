import { browser } from 'wxt/browser';
import { createI18n, type Catalog, type Params } from './i18n-core';

/**
 * Every file in src/locales/*.json is a language. Adding a file adds a language,
 * no code changes needed (see docs/TRANSLATING.md).
 */
const modules = import.meta.glob<Catalog>('../locales/*.json', { eager: true, import: 'default' });
const catalogs: Record<string, Catalog> = {};
for (const [path, catalog] of Object.entries(modules)) {
  const code = /([^/]+)\.json$/.exec(path)?.[1];
  if (code) catalogs[code] = catalog;
}

const i18n = createI18n(catalogs);
let active = 'en';

function browserLanguage(): string {
  try {
    return browser.i18n.getUILanguage();
  } catch {
    return navigator.language;
  }
}

/** Language code that a setting ("auto" or a code) resolves to. */
export function detectLanguage(setting = 'auto'): string {
  return i18n.resolveLanguage(setting, browserLanguage());
}

/** Switches the language used by t() and locale(). Call it before rendering. */
export function setLanguage(setting: string): string {
  active = detectLanguage(setting);
  return active;
}

/** Translates a key into the active language. */
export function t(key: string, params?: Params): string {
  return i18n.translate(active, key, params);
}

/** Translates into a specific language (used when the active one is not set yet). */
export const translateTo = i18n.translate;

/** Locale code for Intl and date formatting, e.g. "ru". */
export function locale(): string {
  return active;
}

export const availableLocales = i18n.locales;
