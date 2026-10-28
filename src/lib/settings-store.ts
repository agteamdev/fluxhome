import { applyWidgetSelection, clearFailedFavicons, setColumnCount } from './page-ops';
import { storage } from './storage';
import type { Settings, WidgetType } from './types';
import { uid } from '@/utils/id';

export interface SaveOptions {
  /** The page whose widget selection is applied. */
  pageId: string;
  /** Widget types that should be visible on that page. */
  widgets: WidgetType[];
  /** Forget "no icon found" markers (used when site icons are switched on). */
  resetIcons: boolean;
}

/** Saves the settings; every page gets the chosen number of columns, the current page gets the widget selection. */
export async function saveSettings(settings: Settings, options: SaveOptions): Promise<void> {
  const pages = (await storage.get('pages')) ?? [];
  const next = pages.map((page) => {
    let result = setColumnCount(page, settings.columnsCount, uid);
    if (page.id === options.pageId) result = applyWidgetSelection(result, options.widgets, settings.columnsCount, uid);
    if (options.resetIcons) result = clearFailedFavicons(result);
    return result;
  });
  await storage.setMany({ settings, pages: next });
}
