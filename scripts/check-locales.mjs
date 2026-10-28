// Checks the language files in src/locales:
//  1. every key used in the source code exists in en.json (the reference language)
//  2. every other language has exactly the same keys as en.json
//  3. placeholders like {name} match the English text
//  4. every file has a "meta.name" and valid JSON
// Usage: node scripts/check-locales.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const localesDir = 'src/locales';
let failures = 0;
const fail = (message) => {
  failures++;
  console.error(`  FAIL ${message}`);
};

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const catalogs = {};
for (const file of readdirSync(localesDir).filter((f) => f.endsWith('.json'))) {
  const code = file.replace(/\.json$/, '');
  try {
    catalogs[code] = JSON.parse(readFileSync(join(localesDir, file), 'utf8'));
  } catch (error) {
    fail(`${file}: invalid JSON (${error.message})`);
  }
}

const reference = catalogs.en;
if (!reference) {
  fail('src/locales/en.json is missing');
  process.exit(1);
}
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

// 1. keys used in the code must exist in en.json
const namespaces = new Set(Object.keys(reference).map((k) => k.split('.')[0]));
const used = new Set();
for (const file of walk('src').filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/'([a-z]+\.[A-Za-z0-9.]+)'/g)) {
    const key = match[1];
    const root = key.split('.')[0];
    // Only strings that look like our keys (known first part, not a file name)
    if (namespaces.has(root) && !/\.(ts|js|json|css|html|png)$/.test(key)) used.add(`${key}\u0000${file}`);
  }
}
for (const entry of used) {
  const [key, file] = entry.split('\u0000');
  if (!(key in reference)) fail(`${file}: key "${key}" is not in en.json`);
}

// 2-4. compare every language with English
for (const [code, catalog] of Object.entries(catalogs)) {
  if (!catalog['meta.name']) fail(`${code}.json: "meta.name" is missing`);
  if (code === 'en') continue;
  const missing = Object.keys(reference).filter((k) => !(k in catalog));
  const extra = Object.keys(catalog).filter((k) => !(k in reference));
  if (missing.length) fail(`${code}.json: missing keys: ${missing.join(', ')}`);
  if (extra.length) fail(`${code}.json: unknown keys: ${extra.join(', ')}`);
  for (const key of Object.keys(reference)) {
    if (key in catalog && placeholders(reference[key]) !== placeholders(catalog[key])) {
      fail(`${code}.json: placeholders of "${key}" differ from English (expected {${placeholders(reference[key])}})`);
    }
  }
}

const languages = Object.keys(catalogs).join(', ');
console.log(`Languages: ${languages}; ${Object.keys(reference).length} keys each.`);
console.log(failures === 0 ? 'All locale checks passed.' : `${failures} locale check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
