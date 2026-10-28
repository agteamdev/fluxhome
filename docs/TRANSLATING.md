# Translating FluxHome

FluxHome speaks the language you choose in **Settings → Language** (or follows the browser language).
Every language is one file in `src/locales/`. Adding a file adds a language: no code changes are needed.

## Send a translation (the easy way)

You do not need Git. Open a new issue with the **Translation** template and attach your finished file
(see the steps below). We will add it to the next release and credit you if you like.

## Steps

1. Copy `src/locales/en.json` and name the copy after the language code, for example `de.json`,
   `uk.json`, `pt-br.json` (use lowercase; this is the code your browser reports, like `ru` or `pt-br`).
2. Open the copy in any text editor that saves plain UTF-8 (VS Code, Notepad++, Kate, ...).
3. Set `"meta.name"` to the name of the language **in that language**, for example `"Deutsch"` or `"Українська"`.
   This is what appears in the language list.
4. Translate the **values** (the text on the right). Do not change the **keys** (the text on the left).
5. Keep the `{placeholders}` exactly as they are. They are replaced by the program, for example
   `"Search with {engine}…"` becomes `"Search with Brave…"`. You may move them inside the sentence.
6. Keep the quotation marks and commas of the JSON format. If you are unsure, paste the file into
   an online JSON validator.

Tips:

- Plurals are avoided on purpose. If your language needs a different form for numbers, rephrase the sentence
  so the number stands alone (for example "Bookmarks: {count}").
- Keep texts short: they appear on buttons and in narrow cards.
- Names of search engines and time zones are not translated.

## Check your file (for contributors who build the project)

```bash
npm run check:locales
```

The check reports missing keys, unknown keys and placeholders that do not match English.
`npm run verify` runs it as well.

## Updating a translation

When new texts are added to `en.json`, the check shows which keys your file is missing. Until they are translated,
FluxHome shows the English text for them.
