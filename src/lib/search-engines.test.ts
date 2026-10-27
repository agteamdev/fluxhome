import { describe, expect, it } from 'vitest';
import { buildSearchUrl, DEFAULT_ENGINE, parseEngine } from './search-engines';

describe('search engines', () => {
  it('defaults to Brave', () => {
    expect(DEFAULT_ENGINE).toBe('brave');
    expect(parseEngine(undefined)).toBe('brave');
    expect(parseEngine('yandex')).toBe('brave');
    expect(parseEngine('google')).toBe('google');
  });
  it('builds URLs for every engine', () => {
    expect(buildSearchUrl('brave', 'cats')).toBe('https://search.brave.com/search?q=cats');
    expect(buildSearchUrl('duckduckgo', 'cats')).toBe('https://duckduckgo.com/?q=cats');
    expect(buildSearchUrl('google', 'cats')).toBe('https://www.google.com/search?q=cats');
  });
  it('encodes special characters', () => {
    expect(buildSearchUrl('brave', ' c++ & rust ')).toBe('https://search.brave.com/search?q=c%2B%2B%20%26%20rust');
  });
  it('returns null for an empty query', () => {
    expect(buildSearchUrl('brave', '   ')).toBeNull();
  });
});
