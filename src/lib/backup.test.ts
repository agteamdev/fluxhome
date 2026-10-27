import { afterEach, describe, expect, it } from 'vitest';
import { buildBackup, ImportError, parseBackup } from './backup';
import { createDefaultData } from './defaults';
import { migrations } from './migrations';
import { SCHEMA_VERSION } from './types';

const roundTrip = (obj: unknown) => parseBackup(JSON.stringify(obj));

describe('export -> import round trip', () => {
  it('restores the same data', () => {
    const config = createDefaultData();
    config.settings.userName = 'Alex';
    config.todos.push({ id: 't1', text: 'Write tests', done: false, priority: 'high' });

    const result = parseBackup(JSON.stringify(buildBackup(config, '0.3.0')));
    expect(result.data).toEqual(config);
    expect(result.dropped).toBe(0);
    expect(result.stats.pages).toBe(1);
    expect(result.stats.todos).toBe(1);
  });

  it('writes the app marker and version', () => {
    const backup = buildBackup(createDefaultData(), '0.3.0', new Date('2026-01-02T03:04:05Z'));
    expect(backup.app).toBe('fluxhome');
    expect(backup.schemaVersion).toBe(SCHEMA_VERSION);
    expect(backup.exportedAt).toBe('2026-01-02T03:04:05.000Z');
  });
});

describe('rejecting bad files', () => {
  it('rejects invalid JSON', () => {
    expect(() => parseBackup('not json')).toThrow(ImportError);
  });
  it('rejects files that are not FluxHome backups', () => {
    expect(() => roundTrip({ hello: 'world' })).toThrow(ImportError);
    expect(() => roundTrip({ app: 'other', schemaVersion: 1, data: {} })).toThrow(ImportError);
  });
  it('rejects a backup from a newer schema', () => {
    expect(() => roundTrip({ app: 'fluxhome', schemaVersion: SCHEMA_VERSION + 1, data: {} })).toThrow(/newer/);
  });
  it('rejects a backup without pages', () => {
    expect(() => roundTrip({ app: 'fluxhome', schemaVersion: SCHEMA_VERSION, data: { pages: [] } })).toThrow(/no pages/);
  });
});

describe('sanitizing', () => {
  it('drops bookmarks with unsafe URLs and counts them', () => {
    const backup = buildBackup(createDefaultData());
    const group = backup.data.pages[0]!.groups[0]!;
    const good = group.bookmarks.length;
    group.bookmarks.push({ id: 'x', title: 'Evil', url: 'javascript:alert(1)', createdAt: 0 });
    const result = roundTrip(backup);
    expect(result.dropped).toBe(1);
    expect(result.data.pages[0]!.groups[0]!.bookmarks).toHaveLength(good);
  });

  it('fills missing settings with defaults', () => {
    const backup = buildBackup(createDefaultData());
    (backup.data as unknown as Record<string, unknown>).settings = { theme: 'dark', columnsCount: 99 };
    const { settings } = roundTrip(backup).data;
    expect(settings.theme).toBe('dark');
    expect(settings.columnsCount).toBe(6);
    expect(settings.showGreeting).toBe(true);
  });

  it('regenerates duplicate ids', () => {
    const backup = buildBackup(createDefaultData());
    const bookmarks = backup.data.pages[0]!.groups[0]!.bookmarks;
    bookmarks[1]!.id = bookmarks[0]!.id;
    const out = roundTrip(backup).data.pages[0]!.groups[0]!.bookmarks;
    expect(out[0]!.id).not.toBe(out[1]!.id);
  });

  it('moves widgets with an unknown column to the first column', () => {
    const backup = buildBackup(createDefaultData());
    const page = backup.data.pages[0]!;
    page.widgets[0]!.columnId = 'missing';
    const out = roundTrip(backup).data.pages[0]!;
    expect(out.widgets[0]!.columnId).toBe(out.columns[0]!.id);
  });

  it('falls back to the first page when activePageId is unknown', () => {
    const backup = buildBackup(createDefaultData());
    backup.data.activePageId = 'nope';
    const result = roundTrip(backup);
    expect(result.data.activePageId).toBe(result.data.pages[0]!.id);
  });
});

describe('migration of older files', () => {
  afterEach(() => {
    delete migrations[0];
  });

  it('runs migrations before sanitizing', () => {
    // Simulate "schema 0" files that stored the user name under an old key
    migrations[0] = (data) => {
      const settings = { ...(data.settings as object), userName: (data.settings as { name?: string }).name };
      return { ...data, settings };
    };
    const backup = buildBackup(createDefaultData());
    (backup.data as unknown as Record<string, unknown>).settings = { name: 'Old User' };
    const result = roundTrip({ ...backup, schemaVersion: 0 });
    expect(result.sourceVersion).toBe(0);
    expect(result.data.settings.userName).toBe('Old User');
    expect(result.data.schemaVersion).toBe(SCHEMA_VERSION);
  });
});
