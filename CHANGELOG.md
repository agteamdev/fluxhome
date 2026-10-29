# Changelog

This project follows [Semantic Versioning](https://semver.org).

## 0.11.1

- Fix: rows of bookmarks, notes and tasks are highlighted on hover with fully transparent cards too (the highlight now works over any background); the edit/delete buttons float as a small solid toolbar.
- Store screenshots for Firefox with captions; publishing guide updated: Firefox first, Chrome and Edge later.

## 0.11.0

- Store preparation: privacy policy (`PRIVACY.md`), listing texts in English and Russian, promo images, publishing checklist (`store/`).
- Extension name and description are localized (`public/_locales`), so the stores and the browser show them in the user's language.
- `npm run package` runs all checks and builds the store packages for Chromium and Firefox.

## 0.10.1

- Bookmarks, notes and tasks use the full width of the card: the edit/delete buttons now float over the row on hover instead of reserving space. Long titles may take two lines.
- The star of a pinned note sits in front of its title.
- Scrollbars match the extension theme; native controls follow the chosen theme (`color-scheme`).
- Smaller background swatches in the settings.
- README: "Support Development" section; GitHub Sponsor button (Patreon).

## 0.10.0

- Languages: English and Russian; choose in Settings (or follow the browser). New languages are added by dropping a JSON file into `src/locales` (see `docs/TRANSLATING.md`); `npm run check:locales` validates translations.
- Settings gear in the header replaces the text button; widgets, export and import moved into the settings window.
- Web search is now one strip in the header with an engine picker (Brave by default, DuckDuckGo, Google) next to the bookmark search. Existing search widgets are migrated automatically (data schema 2).
- Site icons for bookmarks, downloaded directly from each site (optional; asks for the website permission only when switched on).
- Right-click menu: "Save link to FluxHome" and "Save this page to FluxHome".
- Fewer permissions: removed `tabs`, `bookmarks`, `alarms` and required access to all websites; added `activeTab`.
- Cards can be made transparent (solid, slightly transparent, glass, fully transparent).
- Tooltips in the extension design.
- Notes and tasks: edit and delete buttons appear on hover, like in bookmarks.
- Removed the unused "rss" widget type.

## 0.9.1

- Fix: header buttons (Widgets, Settings, Export, Import) were unreadable on light backgrounds; they now have their own surface color.
- Todos: a deadline can include a time (5-minute steps). Overdue open tasks get a yellow warning triangle; the widget updates by itself when a deadline passes.

## 0.9.0

- Settings window (header button): your name, greeting on/off and time-of-day greeting, theme, number of columns (1-4), background (14 ready-made colors and gradients, or an image address).
- Changing the number of columns moves the widgets of removed columns to the remaining ones.
- Todos: new tasks are added through a "+ Task" dialog (like notes); the always-visible add row is gone.
- Cleaner drag grip on widget headers (dots are drawn with CSS and sit closer together).

## 0.8.1

- Fix: icons are now in `public/icons` (the project root), the folder WXT copies into the build. Before, they were missing from the extension and Chromium refused to load the manifest.

## 0.8.0

- Logo and extension icons (16, 32, 48, 96, 128); icons are now listed explicitly in the manifest.
- Bookmark group tabs can be dragged to change their order.
- Fix: the edit/delete buttons of the groups no longer jump below the tabs.
- Drop-downs and the date picker now use the extension design (own components instead of the browser's native popups): priority, search engine, clock settings, task deadline, time zone picker.

## 0.7.1

- Clock settings: world clocks are now chosen from a scrollable drop-down of the time zones the browser supports (grouped by region, with UTC offsets and a filter box) instead of typing names.

## 0.7.0

- Clock widget: digital or analog style, 24/12-hour format, world clocks by IANA time zone (settings via the gear button).
- Web search widget: Brave (default), DuckDuckGo or Google.
- "Widgets" button in the header: show or hide widgets on the page.
- New installs start with the search and clock widgets enabled.

## 0.6.0

- Notes widget: create, edit, delete and pin notes; notes are viewed as rendered Markdown (headings, lists, bold, italic, code, safe links).
- Todos widget: quick-add row, checkboxes, priorities, deadlines (overdue highlighted), edit, delete, "Clear done".
- Dialogs support multi-line text, date and select fields.
- Added the MIT license.

## 0.5.1

- Fix: Firefox is now built as Manifest V3 (`.output/firefox-mv3`); WXT defaults to Manifest V2 for Firefox.

## 0.5.0

- Firefox: `data_collection_permissions` ("none") declared as required by addons.mozilla.org; minimum Firefox version 140.
- ESLint with project rules (no `chrome.*` globals, no eval, no HTML string assignment).
- `npm run check` validates the built manifests; `npm run lint:firefox` runs `web-ext lint`; `npm run verify` runs everything.
- Testing guide with a manual checklist (`docs/TESTING.md`).

## 0.4.0

- Search: instant filtering of all bookmarks on the page (title, URL, tags, group name). Press `/` to focus, `Enter` opens the first result, `Esc` clears.
- Popup: "Save this page" button in the toolbar. Choose the group or create a new one, edit the title; warns if the URL is already saved.
- Shared theme variables (`src/assets/theme.css`).

## 0.3.0

- Export: download all data as a JSON backup (`fluxhome-backup-YYYY-MM-DD.json`).
- Import: restore from a backup file with validation, schema version check, automatic migration of older backups and sanitizing (unsafe URLs, duplicate ids, missing fields).
- Toast notifications.

## 0.2.0

- Bookmarks: add, edit and delete bookmarks; add, rename and delete groups (modal dialogs, http/https URLs only).
- Drag & drop: reorder bookmarks, move them to another group (drop on a tab), move widgets between columns.
- Pure page operations (`src/lib/page-ops.ts`) with unit tests (Vitest).

## 0.1.0

- Project scaffold: WXT + TypeScript, Manifest V3, builds for Chromium and Firefox.
- New tab page override.
- Storage wrapper (get / set / remove / watch) with schema migrations.
- Page rendering: greeting, columns, read-only bookmarks widget, light/dark/auto theme.
