/** Pure translation logic (no browser APIs), so it can be unit tested. */
export type Catalog = Record<string, string>;
export type Params = Record<string, string | number>;

export interface LocaleInfo {
  code: string;
  /** Name of the language in that language, from the "meta.name" key of its file. */
  name: string;
}

export function createI18n(catalogs: Record<string, Catalog>, fallback = 'en') {
  /** Looks the key up in the language, then in the fallback language, then returns the key itself. */
  function translate(code: string, key: string, params?: Params): string {
    const template = catalogs[code]?.[key] ?? catalogs[fallback]?.[key] ?? key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) => (params[name] !== undefined ? String(params[name]) : match));
  }

  /** "auto" follows the browser language ("ru-RU" -> "ru"); unknown languages fall back to English. */
  function resolveLanguage(setting: string, uiLanguage: string): string {
    if (setting !== 'auto' && catalogs[setting]) return setting;
    const ui = uiLanguage.toLowerCase();
    if (catalogs[ui]) return ui;
    const base = ui.split('-')[0] ?? '';
    return catalogs[base] ? base : fallback;
  }

  function locales(): LocaleInfo[] {
    return Object.keys(catalogs)
      .map((code) => ({ code, name: catalogs[code]?.['meta.name'] ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return { translate, resolveLanguage, locales };
}
