# Testing FluxHome

## Automatic checks

```bash
npm run lint        # ESLint (no chrome.* globals, no eval, no innerHTML)
npm run check:locales # language files (missing keys, placeholders)
npm run typecheck   # TypeScript
npm test            # unit tests (Vitest)
npm run verify      # all of the above + builds for Chromium and Firefox + build checks
```

`npm run check` inspects the built manifests (Manifest V3, new tab override, popup, icons,
permissions, gecko ID, `data_collection_permissions`, CSP, no remote scripts, package size).

`npm run lint:firefox` builds the Firefox package and runs `web-ext lint` — the same validator
addons.mozilla.org uses. Fix every **error**; read every **warning**.

## Installing in Firefox (desktop)

1. `npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`.
3. **Load Temporary Add-on…** and select `.output/firefox-mv3/manifest.json`.
4. Temporary add-ons are removed when Firefox closes. Repeat after each restart.
5. Open a new tab. Firefox may show a notice that an extension controls the new tab page.

Firefox notes:

- Access to websites is optional: it is requested only when you switch on "site icons" in the settings. Firefox shows its own permission prompt.
- On a new tab Firefox puts the cursor in the address bar. Click the page (or press `Tab`) before using the `/` search shortcut.
- If two extensions override the new tab, Firefox lets the first one win.
- **Firefox for Android does not support new tab overrides** (`chrome_url_overrides`), so FluxHome targets desktop Firefox only. Untick Android on the AMO listing.

## Manual checklist

### Functional

- [ ] A new tab shows the saved configuration
- [ ] Bookmarks can be added, edited and deleted
- [ ] Groups switch like tabs; groups can be added, renamed, deleted
- [ ] Drag and drop between columns works without data loss (reload the tab to confirm)
- [ ] Export creates a valid JSON file
- [ ] Import restores the state from that file
- [ ] Importing a non-FluxHome file shows an error and changes nothing
- [ ] Search filters in real time
- [ ] The popup "Save this page" button adds the current page

### Cross-browser

- [ ] Brave, Chrome, Edge behave the same
- [ ] Firefox: manifest loads without warnings (`npm run lint:firefox`)
- [ ] No errors in the DevTools console (new tab page and popup)
- [ ] No memory growth after reloading the new tab 10+ times (DevTools → Memory → take a snapshot before and after)

### Performance (spec targets)

- [ ] New tab renders in under 300 ms (DevTools → Performance → reload, check DOMContentLoaded)
- [ ] Memory under 30 MB (browser Task Manager: Shift+Esc in Chromium)

### Code quality

- [ ] `npm run verify` passes
- [ ] README explains how to run and build
- [ ] `.gitignore` excludes dependencies and build artifacts
