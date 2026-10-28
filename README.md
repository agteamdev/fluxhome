<p align="center"><img src="docs/logo.png" alt="FluxHome logo" width="128"></p>

# FluxHome

A local-first start page for Chromium-based browsers and Firefox.
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
npm run lint           # ESLint
npm run verify         # lint + typecheck + tests + both builds + build checks
```

See [docs/TESTING.md](docs/TESTING.md) for the manual checklist.

### Install in Brave / Chrome / Edge

1. Open `brave://extensions` (Chrome: `chrome://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `.output/chrome-mv3` folder.

### Install in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `.output/firefox-mv3/manifest.json`.

Requires Firefox 140 or newer. Firefox for Android does not support new tab overrides and is not a target.

## Project structure

- `src/entrypoints/` — entry points (new tab, popup, background)
- `src/lib/` — storage wrapper, types, migrations, defaults
- `src/widgets/` — widgets (one module per widget)
- `src/components/` — shared UI components
- `src/assets/` — shared styles
- `src/utils/` — helpers
- `public/icons/` — extension icons (16/32/48/96/128), copied into the build as-is

## Versioning

[Semantic Versioning](https://semver.org). See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
