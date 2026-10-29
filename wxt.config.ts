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
  // Name of the .zip files: fluxhome-<version>-<browser>.zip (the manifest name is a translation placeholder)
  zip: { name: 'fluxhome' },
  manifest: ({ browser }) => ({
    // Name and description come from public/_locales/<language>/messages.json (shown in the stores and the browser)
    default_locale: 'en',
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    // Only what is used today:
    //  - storage: all data stays in the browser
    //  - activeTab: the toolbar popup reads the title/address of the current tab when you click it
    //  - contextMenus: "Save link / page to FluxHome" in the right-click menu
    // Access to websites is optional: it is requested only if you turn on "site icons" in the settings.
    permissions: ['storage', 'activeTab', 'contextMenus'],
    optional_host_permissions: ['<all_urls>'],
    // Listed explicitly (files live in public/icons) instead of relying on automatic detection
    icons: {
      16: 'icons/16.png',
      32: 'icons/32.png',
      48: 'icons/48.png',
      96: 'icons/96.png',
      128: 'icons/128.png',
    },
    ...(browser === 'firefox' ? firefoxSettings : {}),
  }),
});
