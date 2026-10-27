import { defineConfig } from 'wxt';

// One config for all browsers. The extension version is taken from package.json.
// Chrome / Brave / Edge / Opera / Vivaldi -> .output/chrome-mv3
// Firefox                                  -> .output/firefox-mv3
export default defineConfig({
  srcDir: 'src',
  manifest: ({ browser }) => ({
    name: 'FluxHome',
    description: 'Local-first start page: bookmarks, notes, todos. No cloud, no telemetry.',
    permissions: ['storage', 'tabs', 'contextMenus', 'bookmarks', 'alarms'],
    host_permissions: ['<all_urls>'],
    // Firefox requires a unique extension ID from the very first build
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'fluxhome@agteamdev',
              strict_min_version: '115.0',
            },
          },
        }
      : {}),
  }),
});
