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

describe('migration 2 -> 3', () => {
  it('adds empty timers and calendar data', () => {
    const result = migrateData({ pages: [], settings: {} }, 2) as Record<string, unknown>;
    expect(result.timeEntries).toEqual([]);
    expect(result.events).toEqual([]);
    expect(result.activeTracker).toBe(null);
    expect(result.countdown).toBe(null);
    expect(result.schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('keeps existing values', () => {
    const entries = [{ id: 'a', label: 'x', start: 1, end: 2 }];
    expect((migrateData({ timeEntries: entries }, 2) as Record<string, unknown>).timeEntries).toEqual(entries);
  });
  it('migrates all the way from version 1', () => {
    const result = migrateData(v1(), 1) as Record<string, unknown>;
    expect(result.events).toEqual([]);
    expect((result.settings as Record<string, unknown>).language).toBe('auto');
  });
});

describe('migration 3 -> 4', () => {
  const page = (widgets: unknown[]) => ({ pages: [{ id: 'p', widgets }] });
  const run = (widgets: unknown[]) =>
    (migrateData(page(widgets), 3) as { pages: { widgets: { id: string; type: string; columnId: string; order: number }[] }[] }).pages[0]!.widgets;

  it('adds a work time widget right below the timers widget', () => {
    const result = run([
      widget('a', 'bookmarks'),
      { id: 't', type: 'timers', columnId: 'c1', order: 1, props: {} },
      { id: 'n', type: 'notes', columnId: 'c1', order: 2, props: {} },
    ]);
    const work = result.find((w) => w.type === 'worktime')!;
    expect(work.columnId).toBe('c1');
    expect(work.order).toBe(2);
    expect(result.find((w) => w.id === 'n')!.order).toBe(3);
  });
  it('does nothing without a timers widget or when a work time widget exists', () => {
    expect(run([widget('a', 'bookmarks')]).map((w) => w.type)).toEqual(['bookmarks']);
    expect(run([widget('t', 'timers'), widget('w', 'worktime')]).filter((w) => w.type === 'worktime')).toHaveLength(1);
  });
  it('survives data without pages', () => {
    expect((migrateData({}, 3) as { pages: unknown[] }).pages).toEqual([]);
  });
});
