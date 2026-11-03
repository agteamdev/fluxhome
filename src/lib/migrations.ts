import { SCHEMA_VERSION } from './types';

type Data = Record<string, unknown>;
type Migration = (data: Data) => Data;

/**
 * Schema migrations. Key N is a function that upgrades data from version N to N+1.
 * When the schema changes: bump SCHEMA_VERSION in types.ts and add a function here.
 *
 * Example for the future (version 4 -> 5):
 *   4: (d) => ({ ...d, newField: 'value' }),
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const migrations: Record<number, Migration> = {
  /**
   * 3 -> 4: the work time tracker became its own widget ("worktime"), separate from the timers.
   * Everyone who already has a timers widget gets a work time widget right below it, so the tracker does not disappear.
   */
  3: (data) => ({
    ...data,
    pages: (Array.isArray(data.pages) ? data.pages : []).map((page: unknown) => {
      if (!isRecord(page) || !Array.isArray(page.widgets)) return page;
      const widgets: unknown[] = page.widgets;
      const timers = widgets.find((w) => isRecord(w) && w.type === 'timers');
      if (!isRecord(timers) || widgets.some((w) => isRecord(w) && w.type === 'worktime')) return page;

      const order = typeof timers.order === 'number' ? timers.order : 0;
      const shifted = widgets.map((w) =>
        isRecord(w) && w.columnId === timers.columnId && typeof w.order === 'number' && w.order > order ? { ...w, order: w.order + 1 } : w,
      );
      return { ...page, widgets: [...shifted, { id: crypto.randomUUID(), type: 'worktime', columnId: timers.columnId, order: order + 1, props: {} }] };
    }),
  }),

  /** 2 -> 3: new data for the timers and calendar widgets. */
  2: (data) => ({
    ...data,
    timeEntries: Array.isArray(data.timeEntries) ? data.timeEntries : [],
    activeTracker: data.activeTracker ?? null,
    countdown: data.countdown ?? null,
    events: Array.isArray(data.events) ? data.events : [],
  }),

  /**
   * 1 -> 2
   *  - the web search moved from a widget to the header: its engine becomes settings.searchEngine
   *  - the unused "rss" widget type was removed
   *  - new settings: language, showWebSearch, cardOpacity, siteIcons
   */
  1: (data) => {
    let engine: unknown;
    const pages = (Array.isArray(data.pages) ? data.pages : []).map((page: unknown) => {
      if (!isRecord(page)) return page;
      const widgets: unknown[] = [];
      for (const widget of Array.isArray(page.widgets) ? page.widgets : []) {
        if (isRecord(widget) && (widget.type === 'search' || widget.type === 'rss')) {
          if (widget.type === 'search' && engine === undefined && isRecord(widget.props)) engine = widget.props.engine;
          continue;
        }
        widgets.push(widget);
      }
      return { ...page, widgets };
    });
    const old = isRecord(data.settings) ? data.settings : {};
    return {
      ...data,
      pages,
      settings: {
        ...old,
        language: old.language ?? 'auto',
        showWebSearch: old.showWebSearch ?? true,
        searchEngine: typeof engine === 'string' ? engine : (old.searchEngine ?? 'brave'),
        cardOpacity: old.cardOpacity ?? 1,
        siteIcons: old.siteIcons ?? false,
      },
    };
  },
};

export function migrateData(data: Data, fromVersion: number): Data {
  let current = fromVersion;
  let result = data;
  if (current > SCHEMA_VERSION) {
    throw new Error(
      `Data was created by a newer FluxHome version (schema ${current}, supported ${SCHEMA_VERSION}). Please update the extension.`,
    );
  }
  while (current < SCHEMA_VERSION) {
    const step = migrations[current];
    if (!step) throw new Error(`No migration from schema ${current} to ${current + 1}`);
    result = step(result);
    current += 1;
  }
  return { ...result, schemaVersion: SCHEMA_VERSION };
}
