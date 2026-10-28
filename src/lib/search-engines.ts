/** Web search engines offered by the search bar. */
export const SEARCH_ENGINES = [
  { id: 'brave', name: 'Brave', url: 'https://search.brave.com/search?q=', badge: { text: 'B', color: '#fb542b' } },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', badge: { text: 'D', color: '#de5833' } },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', badge: { text: 'G', color: '#4285f4' } },
] as const;

export type EngineId = (typeof SEARCH_ENGINES)[number]['id'];

export const DEFAULT_ENGINE: EngineId = 'brave';

/** Unknown or missing values fall back to the default engine. */
export function parseEngine(value: unknown): EngineId {
  return SEARCH_ENGINES.find((e) => e.id === value)?.id ?? DEFAULT_ENGINE;
}

/** Builds the results URL, or null when the query is empty. */
export function buildSearchUrl(engine: EngineId, query: string): string | null {
  const text = query.trim();
  if (!text) return null;
  const base = SEARCH_ENGINES.find((e) => e.id === engine)!.url;
  return base + encodeURIComponent(text);
}
