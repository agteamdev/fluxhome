# FluxHome

A local-first start page (a start.me alternative) for Chromium-based browsers and Firefox.
All data stays in your browser. No cloud, no ads, no telemetry.

## Requirements

- Node.js 20+ (22 LTS recommended)
- npm

## Getting started

```bash
npm install
npm run build          # Chromium -> .output/chrome-mv3
npm run build:firefox  # Firefox  -> .output/firefox-mv3
npm run typecheck
npm test               # unit tests (Vitest)
```

### Install in Brave / Chrome / Edge

1. Open `brave://extensions` (Chrome: `chrome://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `.output/chrome-mv3` folder.

### Install in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `.output/firefox-mv3/manifest.json`.

## Project structure

- `src/entrypoints/` — entry points (new tab, background, popup later)
- `src/lib/` — storage wrapper, types, migrations, defaults
- `src/widgets/` — widgets (one module per widget)
- `src/components/` — shared UI components
- `src/utils/` — helpers
- `src/public/icons/` — extension icons (16/32/48/128)

## Versioning

[Semantic Versioning](https://semver.org). See [CHANGELOG.md](CHANGELOG.md).
