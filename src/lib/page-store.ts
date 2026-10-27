import { storage } from './storage';
import type { Page } from './types';

/**
 * Reads pages from storage, applies a pure transformation to one page and saves the result.
 * Subscribers of storage.watch('pages') are notified automatically, so the UI re-renders.
 */
export async function updatePage(pageId: string, transform: (page: Page) => Page): Promise<void> {
  const pages = await storage.get('pages');
  if (!pages) return;
  await storage.set(
    'pages',
    pages.map((p) => (p.id === pageId ? transform(p) : p)),
  );
}
