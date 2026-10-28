import { createDefaultData } from './defaults';
import { migrateData } from './migrations';
import {
  SCHEMA_VERSION,
  type Bookmark,
  type BookmarkGroup,
  type ColumnConfig,
  type Note,
  type Page,
  type Settings,
  type StorageSchema,
  type Todo,
  type WidgetConfig,
} from './types';
import { uid } from '@/utils/id';
import { parseEngine } from './search-engines';
import { MAX_COLUMNS } from './settings';
import { hostnameOf, normalizeUrl } from '@/utils/url';

/**
 * Backup file format (export/import).
 * Everything here is pure: no storage, no DOM. The UI lives in components/backup-actions.ts.
 */
export const BACKUP_APP_ID = 'fluxhome';
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  schemaVersion: number;
  exportedAt: string;
  extensionVersion?: string;
  data: Omit<StorageSchema, 'schemaVersion'>;
}

/** An error the user can be told about. `key` is a translation key, `params` fill its placeholders. */
export class ImportError extends Error {
  readonly key: string;
  readonly params: Record<string, string | number>;

  constructor(key: string, params: Record<string, string | number> = {}) {
    super(key);
    this.key = key;
    this.params = params;
  }
}

export interface ImportStats {
  pages: number;
  groups: number;
  bookmarks: number;
  notes: number;
  todos: number;
}

export interface ImportResult {
  data: StorageSchema;
  sourceVersion: number;
  stats: ImportStats;
  /** Number of invalid entries that were skipped (e.g. bookmarks with unsafe URLs). */
  dropped: number;
}

export function buildBackup(config: StorageSchema, extensionVersion?: string, now = new Date()): BackupFile {
  const { schemaVersion, ...data } = config;
  return { app: BACKUP_APP_ID, schemaVersion, exportedAt: now.toISOString(), extensionVersion, data };
}

/** Parses, version-checks, migrates and sanitizes backup text. Throws ImportError on any problem. */
export function parseBackup(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError('import.notJson');
  }
  if (!isRecord(raw) || raw.app !== BACKUP_APP_ID || !isRecord(raw.data)) {
    throw new ImportError('import.notBackup');
  }

  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
    throw new ImportError('import.noVersion');
  }
  if (version > SCHEMA_VERSION) {
    throw new ImportError('import.newer', { version });
  }

  let migrated: Record<string, unknown>;
  try {
    migrated = migrateData(raw.data, version);
  } catch (error) {
    throw new ImportError('import.migrationFailed', { reason: error instanceof Error ? error.message : String(error) });
  }
  return sanitize(migrated, version);
}

// ---------------------------------------------------------------------------
// Sanitizing: never trust a file the user picked, even if it claims to be ours.
// ---------------------------------------------------------------------------

interface Context {
  dropped: number;
  seenIds: Set<string>;
}

const THEMES = ['light', 'dark', 'auto'] as const;
const BACKGROUNDS = ['solid', 'image', 'gradient'] as const;
const PRIORITIES = ['low', 'medium', 'high'] as const;
const WIDGET_TYPES = ['bookmarks', 'notes', 'todos', 'clock'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const str = (value: unknown, fallback: string): string => (typeof value === 'string' ? value : fallback);
const bool = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);
const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Returns the given id if it is a non-empty string not used before, otherwise a fresh one. */
function uniqueId(value: unknown, ctx: Context): string {
  let id = typeof value === 'string' && value ? value : '';
  if (!id || ctx.seenIds.has(id)) id = uid();
  ctx.seenIds.add(id);
  return id;
}

function sanitizeBookmark(raw: unknown, ctx: Context): Bookmark | null {
  const url = isRecord(raw) && typeof raw.url === 'string' ? normalizeUrl(raw.url) : null;
  if (!isRecord(raw) || !url) {
    ctx.dropped++;
    return null;
  }
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : hostnameOf(url);
  const bookmark: Bookmark = { id: uniqueId(raw.id, ctx), title, url, createdAt: num(raw.createdAt, Date.now()) };

  if (typeof raw.favicon === 'string') {
    const icon = raw.favicon;
    // '' = "no icon found"; data URLs are capped so a bad file cannot bloat the storage
    if (icon === '' || (icon.startsWith('data:image/') && icon.length <= 150_000) || normalizeUrl(icon)) bookmark.favicon = icon;
  }
  const tags = asArray(raw.tags).filter((t): t is string => typeof t === 'string');
  if (tags.length > 0) bookmark.tags = tags;
  return bookmark;
}

function sanitizeGroup(raw: unknown, ctx: Context): BookmarkGroup | null {
  if (!isRecord(raw)) {
    ctx.dropped++;
    return null;
  }
  const bookmarks = asArray(raw.bookmarks)
    .map((b) => sanitizeBookmark(b, ctx))
    .filter((b): b is Bookmark => b !== null);
  return { id: uniqueId(raw.id, ctx), title: str(raw.title, 'Untitled group').trim() || 'Untitled group', bookmarks };
}

function sanitizeColumn(raw: unknown, ctx: Context): ColumnConfig {
  const source = isRecord(raw) ? raw : {};
  const width = isRecord(source.width) ? source.width : {};
  const value = num(width.value, 1);
  return {
    id: uniqueId(source.id, ctx),
    width: { value: value > 0 ? value : 1, unit: oneOf(width.unit, ['%', 'px'] as const, '%') },
  };
}

function sanitizePage(raw: unknown, ctx: Context): Page | null {
  if (!isRecord(raw)) {
    ctx.dropped++;
    return null;
  }
  const groups = asArray(raw.groups)
    .map((g) => sanitizeGroup(g, ctx))
    .filter((g): g is BookmarkGroup => g !== null);

  let columns = asArray(raw.columns).map((c) => sanitizeColumn(c, ctx));
  if (columns.length === 0) columns = [sanitizeColumn(null, ctx)];
  const columnIds = new Set(columns.map((c) => c.id));

  const widgets: WidgetConfig[] = [];
  asArray(raw.widgets).forEach((w, index) => {
    if (!isRecord(w) || !WIDGET_TYPES.includes(w.type as (typeof WIDGET_TYPES)[number])) {
      ctx.dropped++;
      return;
    }
    const widget: WidgetConfig = {
      id: uniqueId(w.id, ctx),
      type: w.type as WidgetConfig['type'],
      // A widget pointing to a missing column is moved to the first column
      columnId: typeof w.columnId === 'string' && columnIds.has(w.columnId) ? w.columnId : columns[0]!.id,
      order: num(w.order, index),
      props: isRecord(w.props) ? w.props : {},
    };
    if (typeof w.height === 'number' && Number.isFinite(w.height) && w.height > 0) widget.height = w.height;
    widgets.push(widget);
  });

  return { id: uniqueId(raw.id, ctx), title: str(raw.title, 'Page').trim() || 'Page', groups, columns, widgets };
}

function sanitizeNote(raw: unknown, ctx: Context): Note | null {
  if (!isRecord(raw)) {
    ctx.dropped++;
    return null;
  }
  const createdAt = num(raw.createdAt, Date.now());
  return {
    id: uniqueId(raw.id, ctx),
    title: str(raw.title, 'Untitled'),
    content: str(raw.content, ''),
    pinned: bool(raw.pinned, false),
    createdAt,
    updatedAt: num(raw.updatedAt, createdAt),
  };
}

function sanitizeTodo(raw: unknown, ctx: Context): Todo | null {
  if (!isRecord(raw) || typeof raw.text !== 'string' || !raw.text.trim()) {
    ctx.dropped++;
    return null;
  }
  const todo: Todo = {
    id: uniqueId(raw.id, ctx),
    text: raw.text,
    done: bool(raw.done, false),
    priority: oneOf(raw.priority, PRIORITIES, 'medium'),
  };
  if (typeof raw.deadline === 'number' && Number.isFinite(raw.deadline)) {
    todo.deadline = raw.deadline;
    if (raw.hasTime === true) todo.hasTime = true;
  }
  return todo;
}

function sanitizeSettings(raw: unknown): Settings {
  const d = createDefaultData().settings;
  const s = isRecord(raw) ? raw : {};
  const bg = isRecord(s.background) ? s.background : {};
  const columnsCount = Math.round(num(s.columnsCount, d.columnsCount));
  return {
    theme: oneOf(s.theme, THEMES, d.theme),
    background: { type: oneOf(bg.type, BACKGROUNDS, d.background.type), value: str(bg.value, d.background.value) },
    showGreeting: bool(s.showGreeting, d.showGreeting),
    userName: str(s.userName, d.userName),
    greetingByTime: bool(s.greetingByTime, d.greetingByTime),
    columnsCount: Math.min(MAX_COLUMNS, Math.max(1, columnsCount)),
    language: str(s.language, d.language) || 'auto',
    showWebSearch: bool(s.showWebSearch, d.showWebSearch),
    searchEngine: parseEngine(s.searchEngine),
    cardOpacity: Math.min(1, Math.max(0, num(s.cardOpacity, d.cardOpacity))),
    siteIcons: bool(s.siteIcons, d.siteIcons),
  };
}

function sanitize(data: Record<string, unknown>, sourceVersion: number): ImportResult {
  const ctx: Context = { dropped: 0, seenIds: new Set() };

  const pages = asArray(data.pages)
    .map((p) => sanitizePage(p, ctx))
    .filter((p): p is Page => p !== null);
  if (pages.length === 0) throw new ImportError('import.noPages');

  const notes = asArray(data.notes)
    .map((n) => sanitizeNote(n, ctx))
    .filter((n): n is Note => n !== null);
  const todos = asArray(data.todos)
    .map((t) => sanitizeTodo(t, ctx))
    .filter((t): t is Todo => t !== null);

  const activePageId =
    typeof data.activePageId === 'string' && pages.some((p) => p.id === data.activePageId)
      ? data.activePageId
      : pages[0]!.id;

  const result: StorageSchema = {
    schemaVersion: SCHEMA_VERSION,
    settings: sanitizeSettings(data.settings),
    pages,
    activePageId,
    notes,
    todos,
  };

  return {
    data: result,
    sourceVersion,
    dropped: ctx.dropped,
    stats: {
      pages: pages.length,
      groups: pages.reduce((n, p) => n + p.groups.length, 0),
      bookmarks: pages.reduce((n, p) => n + p.groups.reduce((m, g) => m + g.bookmarks.length, 0), 0),
      notes: notes.length,
      todos: todos.length,
    },
  };
}
