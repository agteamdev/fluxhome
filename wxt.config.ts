import { defineConfig } from 'wxt';

// Firefox-only manifest settings.
// - id: Firefox requires a unique extension ID from the very first build.
// - data_collection_permissions: required by addons.mozilla.org for new extensions
//   (since 2025-11-03). "none" = FluxHome collects and transmits nothing.
//   Firefox 140+ on desktop and 142+ on Android understand this key.
const firefoxSettings = {
  browser_specific_settings: {
    gecko: {
      id: 'fluxhome@agteamdev',
      strict_min_version: '140.0',
      data_collection_permissions: { required: ['none'] },
    },
    gecko_android: {
      strict_min_version: '142.0',
    },
  },
};

// One config for all browsers. The extension version is taken from package.json.
// Chrome / Brave / Edge / Opera / Vivaldi -> .output/chrome-mv3
// Firefox                                  -> .output/firefox-mv3
export default defineConfig({
  srcDir: 'src',
  // WXT builds Firefox as Manifest V2 by default; we want Manifest V3 everywhere
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'FluxHome',
    description: 'Local-first start page: bookmarks, notes, todos. No cloud, no telemetry.',
    permissions: ['storage', 'tabs', 'contextMenus', 'bookmarks', 'alarms'],
    host_permissions: ['<all_urls>'],
    ...(browser === 'firefox' ? firefoxSettings : {}),
  }),
});
