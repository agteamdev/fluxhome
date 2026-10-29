# Publishing FluxHome

Plan: **Firefox Add-ons (AMO) first.** Chrome Web Store and Microsoft Edge Add-ons come later
(the Chrome store asks for a one-time developer fee; the sections for Chrome and Edge are kept at the end).

> GitHub releases are made **after** the store approves the extension (see the end of this file).

## 1. Firefox account

Create a free account at <https://addons.mozilla.org/developers/> (a normal Firefox account is enough).
Turn on two-step authentication if you can.

## 2. Build the packages

```bash
npm ci
npm run package:firefox
npm run lint:firefox
```

`npm run package:firefox` runs every check (`npm run verify`) and creates, in `.output/`:

| File | Purpose |
|---|---|
| `fluxhome-<version>-firefox.zip` | The add-on package you upload |
| `fluxhome-<version>-sources.zip` | The source code, required by AMO because the build bundles and minifies the code |

`npm run lint:firefox` is the same validator AMO runs. Fix every **error**; read every **warning**.
Every new upload needs a **higher version number** (`package.json`, then `CHANGELOG.md`).

## 3. Submit on AMO

Open the developer hub, choose **Submit a New Add-on**, then:

1. **Distribution:** "On this site" (listed on addons.mozilla.org).
2. **Upload** `fluxhome-<version>-firefox.zip`. Wait for the automatic validation to finish.
3. **Platforms:** keep Desktop; **untick Android** (new tab overrides are not supported there).
4. **Source code:** answer "Yes", upload `fluxhome-<version>-sources.zip`.
   Paste this into **Notes to reviewer**:

   > FluxHome is built with WXT (Vite). The sources zip contains everything needed to rebuild the package.
   > Requirements: Node.js 20 or newer (tested with 22) and npm.
   > Build: `npm ci`, then `npm run zip:firefox`. The package appears in `.output/` as `fluxhome-<version>-firefox.zip`.
   > The extension has no remote code and makes no network requests of its own, except the optional site-icon download
   > (enabled by the user, uses the optional host permission), which fetches each bookmarked site's favicon directly from that site.
   > Extension data stays in storage.local; nothing is transmitted to the authors.

5. **Listing**, copy from `store/listing/en.md` (default language) and add Russian from `store/listing/ru.md`:
   - Name, Summary (max 250 characters), Description.
   - Category: Bookmarks (and Tabs / Other if offered). Tags from the listing file.
   - **License:** MIT License.
   - **Privacy policy:** `https://github.com/agteamdev/fluxhome/blob/main/PRIVACY.md` (the repository must be public).
   - **Support website:** `https://github.com/agteamdev/fluxhome/issues`. Homepage: `https://github.com/agteamdev/fluxhome`.
   - **Icon:** taken from the package. A 128x128 and a 512x512 copy are in `store/assets/`.
   - **Screenshots:** upload `store/screenshots/01.png` to `05.png`, in this order.
6. **Data collection:** the manifest declares `data_collection_permissions: none`; choose that the add-on does not collect data.
7. Submit. The first review can take from a few hours to several days.

AMO requires add-ons that change the new tab page to say so in the description. The description starts with
"FluxHome replaces your new tab page": keep that sentence when editing the text.

## 4. Images

| File | Use |
|---|---|
| `store/screenshots/01.png` ... `05.png` | Listing screenshots (1280x800, captioned) |
| `store/assets/icon-128.png`, `icon-512.png` | Icons for listings |
| `store/assets/promo-small-440x280.png`, `promo-marquee-1400x560.png` | Promo images (Chrome Web Store, Edge) |

To make new screenshots, put raw images into `store/screenshots/raw/` (this folder is not committed; it may show personal data),
edit `store/screenshots/captions.txt` (one caption per line) and run:

```bash
pip install pillow
python3 scripts/make-store-screenshots.py
```

## 5. After approval

1. Make a GitHub release: tag `v<version>`, attach the Firefox zip, link the store page in the description.
2. Add the store link and a badge to `README.md`.

## Later: Chrome Web Store and Edge Add-ons

| Store | Account |
|---|---|
| [Chrome Web Store](https://chrome.google.com/webstore/devconsole) | Google account + one-time developer registration fee (check the dashboard for the current amount) |
| [Microsoft Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge/overview) | Free Microsoft account (Partner Center) |

Package: `npm run package` also builds `fluxhome-<version>-chrome.zip`, which both stores accept.
Brave, Vivaldi and Opera users can install from the Chrome Web Store.

**Single purpose** (Chrome): Replace the new tab page with a customizable, local-first start page that holds the user's bookmarks, notes, tasks and clocks.

**Permission justifications** (Chrome):

- `storage`: stores the user's bookmarks, notes, tasks and settings locally in the browser.
- `activeTab`: when the user clicks the toolbar button, the popup reads the title and address of the current tab so it can be saved as a bookmark. It is not used otherwise.
- `contextMenus`: adds "Save link to FluxHome" and "Save this page to FluxHome" to the right-click menu.
- Optional access to all websites (`optional_host_permissions`): requested only if the user turns on "site icons" in the settings, to download each bookmarked site's own icon directly from that site. It is never requested otherwise and is returned when the user turns the option off.
- New tab override (`chrome_url_overrides`): the main purpose of the extension.

**Remote code:** No. **Data usage:** nothing is collected or transmitted; tick no data categories and certify that data is not sold, not used for unrelated purposes and not used for creditworthiness.
Chrome and Edge accept 1 to 5 screenshots of 1280x800 or 640x400; the images in `store/screenshots/` fit.
