# Changelog

This project follows [Semantic Versioning](https://semver.org).

## 0.2.0

- Bookmarks: add, edit and delete bookmarks; add, rename and delete groups (modal dialogs, http/https URLs only).
- Drag & drop: reorder bookmarks, move them to another group (drop on a tab), move widgets between columns.
- Pure page operations (`src/lib/page-ops.ts`) with unit tests (Vitest).

## 0.1.0

- Project scaffold: WXT + TypeScript, Manifest V3, builds for Chromium and Firefox.
- New tab page override.
- Storage wrapper (get / set / remove / watch) with schema migrations.
- Page rendering: greeting, columns, read-only bookmarks widget, light/dark/auto theme.
