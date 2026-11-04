<p align="center"><img src="docs/logo.png" alt="FluxHome logo" width="128"></p>

# FluxHome

A private, local-first start page for your new tab: bookmarks, notes, tasks, calendar, clocks, timers and work time tracking.
Everything stays in your browser. No account, no cloud, no ads, no telemetry.

**[Add to Firefox](https://addons.mozilla.org/en-US/firefox/addon/fluxhome/)** · [Install in Chrome, Brave or Edge](#chrome-brave-edge-vivaldi-opera) · [Privacy policy](PRIVACY.md)

## Features

- **Bookmarks** in groups (tabs) with emoji or picture icons; drag to reorder; optional site icons.
- **Notes** with Markdown, pinned notes.
- **Tasks** with priorities, deadlines and times; overdue tasks are marked.
- **Calendar** with your own events and repeats; import `.ics` files (read on your device).
- **Work time** tracking with start, pause and stop, and totals for today and the last 7 days.
- **Timers**: a countdown with presets, a sound and an optional notification.
- **Clocks**: digital or analog, plus world clocks.
- **Search**: instant search through your bookmarks and a web search bar (Brave Search, DuckDuckGo or Google).
- **Looks**: light, dark or automatic theme, backgrounds or your own picture, transparent "glass" cards, 1 to 4 columns with adjustable width.
- **Languages**: English and Russian; more can be added by dropping a file into `src/locales` ([how to translate](docs/TRANSLATING.md)).
- **Your data**: export and import as a JSON backup; right-click any link or page to save it.

## Install

### Firefox

Install from [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/fluxhome/). Requires Firefox 140 or newer.
Firefox for Android does not support new tab overrides.

### Chrome, Brave, Edge, Vivaldi, Opera

FluxHome is not on the Chrome Web Store yet, so it is installed manually (it does not update by itself):

1. Download `fluxhome-<version>-chrome.zip` from the [latest release](https://github.com/agteamdev/fluxhome/releases/latest) and unzip it.
2. Open `chrome://extensions` (Brave: `brave://extensions`, Edge: `edge://extensions`) and enable **Developer mode**.
3. Click **Load unpacked** and select the unzipped folder.

## Development

### Requirements

- Node.js 20+ (22 LTS recommended)
- npm

### Getting started

```bash
npm install
npm run build          # Chromium -> .output/chrome-mv3
npm run build:firefox  # Firefox  -> .output/firefox-mv3
npm run typecheck
npm test               # unit tests (Vitest)
npm run lint           # ESLint
npm run check:locales  # language files
npm run verify         # lint + typecheck + tests + both builds + build checks
```

See [docs/TESTING.md](docs/TESTING.md) for the manual checklist.

### Run from source in Brave / Chrome / Edge

1. Open `brave://extensions` (Chrome: `chrome://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `.output/chrome-mv3` folder.

### Run from source in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `.output/firefox-mv3/manifest.json`.

## Project structure

- `src/entrypoints/` — entry points (new tab, popup, background)
- `src/lib/` — storage wrapper, types, migrations, defaults
- `src/widgets/` — widgets (one module per widget)
- `src/components/` — shared UI components
- `src/assets/` — shared styles
- `src/locales/` — language files (one JSON file per language, see [docs/TRANSLATING.md](docs/TRANSLATING.md))
- `src/utils/` — helpers
- `public/icons/` — extension icons (16/32/48/96/128), copied into the build as-is

## Privacy

FluxHome collects nothing and has no servers. See [PRIVACY.md](PRIVACY.md).

## Versioning

[Semantic Versioning](https://semver.org). See [CHANGELOG.md](CHANGELOG.md).

## Support Development

My open-source projects are built independently and remain accessible to everyone.

If you find these tools useful and would like to support their continued development, maintenance, and new features, you can support me on Patreon.

Every contribution helps me dedicate more time to building and improving open-source software.

[Support on Patreon](https://www.patreon.com/al3xg0r)

## License

[MIT](LICENSE)
