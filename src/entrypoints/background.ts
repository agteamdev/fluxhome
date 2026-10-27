import { browser } from 'wxt/browser';
import { initStorage } from '@/lib/config';

// Background service worker (MV3). No DOM is available here.
export default defineBackground(() => {
  // On install/update, prepare storage (defaults or migrations)
  browser.runtime.onInstalled.addListener(() => {
    void initStorage();
  });
});
