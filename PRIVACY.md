# FluxHome Privacy Policy

_Last updated: October 29, 2026_

FluxHome is a browser extension that replaces your new tab page with a start page of bookmarks, notes, tasks and clocks.
It is built for people who want to keep control of their data.

## In short

- **FluxHome does not collect, transmit, sell or share any personal data.**
- Everything you create (bookmarks, notes, tasks, settings) is stored **only in your browser**, on your device.
- There are no accounts, no servers run by us, no analytics, no tracking, no advertising and no remote code.

## What is stored, and where

Your bookmarks, groups, notes, tasks, settings and (optionally) small site icons are saved with the browser's
extension storage (`storage.local`). This data never leaves your device unless you export it yourself.

- **Export** creates a JSON file that you save wherever you choose. **Import** reads a JSON file that you pick.
  Nothing is uploaded anywhere.
- If you remove the extension, the browser deletes its stored data.
- Browser sync is not used by FluxHome. Your data is not copied to other devices unless you move a backup file yourself.

## Network requests

FluxHome makes network requests only in these cases, and only because of something you do:

1. **Opening a bookmark or searching the web.** When you click a bookmark or submit the web search field,
   the browser navigates to that website or to the search engine you chose (Brave Search, DuckDuckGo or Google).
   That site or search engine then receives your request under its own privacy policy. FluxHome does not see or store your searches.
2. **Site icons (optional, off by default).** If you switch on "Show site icons" in the settings, the extension
   downloads the icon of each bookmarked site **directly from that site** (`/favicon.ico` or the icon named in its page).
   No third-party icon service is used. Each site sees an ordinary request, like when you visit it.
   The icons are shrunk and saved locally. Switching the option off returns the website permission to the browser.
3. **Background images (optional).** If you set a background image by web address, the browser loads that image from the address you gave.

FluxHome does not contact any server operated by its authors.

## Permissions and why they are needed

| Permission | Why |
|---|---|
| `storage` | Saves your data locally in the browser. |
| `activeTab` | When you click the toolbar button, the popup reads the title and address of the current tab so you can save it. It is not used otherwise. |
| `contextMenus` | Adds "Save link to FluxHome" and "Save this page to FluxHome" to the right-click menu. |
| Access to websites (optional) | Requested only if you turn on site icons, to download each site's own icon. |
| New tab page override | Shows FluxHome instead of the default new tab page. |

FluxHome does not read your browsing history, your browser's own bookmarks, your cookies, or the content of the pages you visit.

## Children

FluxHome does not collect data from anyone, including children.

## Open source

The complete source code is public, so you can verify all of the above: <https://github.com/agteamdev/fluxhome>

## Changes to this policy

If this policy changes, the new version will be published in this file with a new date, and the changes will be listed in the
[changelog](CHANGELOG.md).

## Contact

Questions or concerns: open an issue at <https://github.com/agteamdev/fluxhome/issues>.
