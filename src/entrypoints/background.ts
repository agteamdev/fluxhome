import { browser } from 'wxt/browser';
import { initStorage, loadConfig } from '@/lib/config';
import { setLanguage, t } from '@/lib/i18n';
import { addBookmarkToFirstGroup, findBookmarkByUrl } from '@/lib/page-ops';
import { updatePage } from '@/lib/page-store';
import { storage } from '@/lib/storage';
import { uid } from '@/utils/id';
import { hostnameOf, normalizeUrl } from '@/utils/url';

const MENU_LINK = 'fluxhome-save-link';
const MENU_PAGE = 'fluxhome-save-page';

/** (Re)creates the right-click menu entries in the current language. */
async function createMenus(): Promise<void> {
  const settings = await storage.get('settings');
  setLanguage(settings?.language ?? 'auto');
  await browser.contextMenus.removeAll();
  browser.contextMenus.create({ id: MENU_LINK, title: t('menu.saveLink'), contexts: ['link'] });
  browser.contextMenus.create({ id: MENU_PAGE, title: t('menu.savePage'), contexts: ['page'] });
}

/** Shows a short mark on the toolbar button (no notification permission needed). */
async function flashBadge(text: string): Promise<void> {
  await browser.action.setBadgeBackgroundColor({ color: '#5b6cff' });
  await browser.action.setBadgeText({ text });
  setTimeout(() => void browser.action.setBadgeText({ text: '' }), 2500);
}

async function saveFromMenu(info: { menuItemId: string | number; linkUrl?: string; pageUrl?: string; linkText?: string }, tabTitle?: string): Promise<void> {
  const isLink = info.menuItemId === MENU_LINK;
  const raw = isLink ? info.linkUrl : info.pageUrl;
  // Only real web addresses can be saved
  const url = raw && /^https?:\/\//i.test(raw) ? normalizeUrl(raw) : null;
  if (!url) return;

  const config = await loadConfig();
  setLanguage(config.settings.language);
  const page = config.pages.find((p) => p.id === config.activePageId) ?? config.pages[0];
  if (!page) return;

  if (findBookmarkByUrl(page, url)) {
    await flashBadge('=');
    return;
  }
  const title = ((isLink ? info.linkText : tabTitle) ?? '').trim() || hostnameOf(url);
  const bookmark = { id: uid(), title, url, createdAt: Date.now() };
  await updatePage(page.id, (p) => addBookmarkToFirstGroup(p, bookmark, uid(), t('default.saved')));
  await flashBadge('✓');
}

// Background service worker (MV3). No DOM is available here.
export default defineBackground(() => {
  // On install/update: prepare storage (defaults or migrations) and create the menus
  browser.runtime.onInstalled.addListener(() => {
    void initStorage().then(createMenus);
  });

  // Menu titles follow the language setting
  storage.watch('settings', (next, previous) => {
    if (next?.language !== previous?.language) void createMenus();
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    void saveFromMenu(info, tab?.title);
  });
});
