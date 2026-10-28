import { browser } from 'wxt/browser';
import { setFavicons } from './page-ops';
import { updatePage } from './page-store';
import type { Page } from './types';
import { fetchFavicon } from '@/utils/favicon';

/** Bookmarks whose icon is being downloaded right now (the page re-renders while we work). */
const inFlight = new Set<string>();
const WORKERS = 3;
const BATCH = 5;

/** True when the optional "all websites" permission is granted. */
export async function hasSitePermission(): Promise<boolean> {
  try {
    return await browser.permissions.contains({ origins: ['<all_urls>'] });
  } catch {
    return false;
  }
}

/**
 * Downloads icons for bookmarks that have none yet (favicon === undefined).
 * Results are saved in batches; "" is saved when a site has no usable icon, so it is not asked again.
 */
export async function loadMissingFavicons(page: Page): Promise<void> {
  const wanted = page.groups.flatMap((g) => g.bookmarks).filter((b) => b.favicon === undefined && !inFlight.has(b.id));
  if (wanted.length === 0 || !(await hasSitePermission())) return;

  for (const b of wanted) inFlight.add(b.id);
  const queue = [...wanted];
  let results: Record<string, string> = {};

  const flush = async (): Promise<void> => {
    const batch = results;
    results = {};
    if (Object.keys(batch).length > 0) await updatePage(page.id, (p) => setFavicons(p, batch));
  };

  const worker = async (): Promise<void> => {
    for (let bookmark = queue.shift(); bookmark; bookmark = queue.shift()) {
      results[bookmark.id] = (await fetchFavicon(bookmark.url)) ?? '';
      if (Object.keys(results).length >= BATCH) await flush();
    }
  };

  try {
    await Promise.all(Array.from({ length: WORKERS }, worker));
    await flush();
  } finally {
    for (const b of wanted) inFlight.delete(b.id);
  }
}
