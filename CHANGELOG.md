# Changelog

This project follows [Semantic Versioning](https://semver.org).

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
