import { describe, expect, it } from 'vitest';
import { migrateData } from './migrations';
import { SCHEMA_VERSION } from './types';

const widget = (id: string, type: string, props: Record<string, unknown> = {}) => ({ id, type, columnId: 'c1', order: 0, props });

const v1 = () => ({
  schemaVersion: 1,
  settings: { theme: 'dark', userName: 'Alex', columnsCount: 3 },
  activePageId: 'p',
  pages: [
    {
      id: 'p',
      title: 'Home',
      groups: [],
      columns: [{ id: 'c1', width: { value: 1, unit: '%' } }],
      widgets: [widget('w1', 'bookmarks'), widget('w2', 'search', { engine: 'google' }), widget('w3', 'rss'), widget('w4', 'clock')],
    },
  ],
});

describe('migration 1 -> 2', () => {
  it('moves the search engine into the settings and removes search/rss widgets', () => {
    const result = migrateData(v1(), 1) as { settings: Record<string, unknown>; pages: { widgets: { id: string }[] }[] };
    expect(result.settings.searchEngine).toBe('google');
    expect(result.pages[0]!.widgets.map((w) => w.id)).toEqual(['w1', 'w4']);
  });
  it('adds the new settings with defaults and keeps the old ones', () => {
    const { settings } = migrateData(v1(), 1) as { settings: Record<string, unknown> };
    expect(settings).toEqual({
      theme: 'dark',
      userName: 'Alex',
      columnsCount: 3,
      language: 'auto',
      showWebSearch: true,
      searchEngine: 'google', // taken from the removed search widget
      cardOpacity: 1,
      siteIcons: false,
    });
  });
  it('stamps the current schema version', () => {
    expect((migrateData(v1(), 1) as { schemaVersion: number }).schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('survives data without pages or settings', () => {
    const result = migrateData({}, 1) as { settings: Record<string, unknown>; pages: unknown[] };
    expect(result.pages).toEqual([]);
    expect(result.settings.language).toBe('auto');
  });
});
