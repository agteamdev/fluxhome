// Sanity checks for the built extensions (manifest, files, CSP, size).
// Usage: node scripts/check-build.mjs [outputDir]   (default: .output)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = process.argv[2] ?? '.output';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // package size limit from the spec (without images)
const REQUIRED_PERMISSIONS = ['storage', 'activeTab', 'contextMenus'];
// Permissions that must NOT be requested up front (stores reject unused or excessive permissions)
const FORBIDDEN_PERMISSIONS = ['tabs', 'bookmarks', 'alarms', 'history', 'downloads', 'webRequest', 'cookies'];

let failures = 0;
const fail = (target, message) => {
  failures++;
  console.error(`  FAIL [${target}] ${message}`);
};
const ok = (target, message) => console.log(`  ok   [${target}] ${message}`);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function checkBuild(name, dir, { firefox }) {
  console.log(`\n${name}: ${dir}`);
  const manifestPath = join(dir, 'manifest.json');
  if (!existsSync(manifestPath)) return fail(name, 'manifest.json not found (run the build first)');
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const has = (rel) => existsSync(join(dir, rel));

  m.manifest_version === 3 ? ok(name, 'Manifest V3') : fail(name, `manifest_version is ${m.manifest_version}`);
  for (const key of ['name', 'version', 'description']) {
    m[key] ? ok(name, `${key}: ${m[key]}`) : fail(name, `missing ${key}`);
  }

  const newtab = m.chrome_url_overrides?.newtab;
  newtab && has(newtab) ? ok(name, `new tab override -> ${newtab}`) : fail(name, 'new tab override missing or file not found');

  const popup = m.action?.default_popup;
  popup && has(popup) ? ok(name, `popup -> ${popup}`) : fail(name, 'popup missing or file not found');

  for (const size of ['16', '32', '48', '96', '128']) {
    const icon = m.icons?.[size];
    icon && has(icon) ? ok(name, `icon ${size}`) : fail(name, `icon ${size} missing`);
  }

  const missing = REQUIRED_PERMISSIONS.filter((p) => !(m.permissions ?? []).includes(p));
  missing.length === 0 ? ok(name, 'permissions') : fail(name, `missing permissions: ${missing.join(', ')}`);

  const forbidden = FORBIDDEN_PERMISSIONS.filter((p) => (m.permissions ?? []).includes(p));
  forbidden.length === 0 ? ok(name, 'no unneeded permissions') : fail(name, `unneeded permissions: ${forbidden.join(', ')}`);

  (m.host_permissions ?? []).length === 0 ? ok(name, 'no required host permissions') : fail(name, 'host_permissions must be optional');
  (m.optional_host_permissions ?? []).includes('<all_urls>')
    ? ok(name, 'optional host permission <all_urls> (site icons)')
    : fail(name, 'optional_host_permissions <all_urls> missing');

  const background = m.background;
  background && (background.service_worker || background.scripts)
    ? ok(name, 'background script')
    : fail(name, 'background script missing');

  const csp = JSON.stringify(m.content_security_policy ?? '');
  /unsafe-(eval|inline)/.test(csp) ? fail(name, 'CSP contains unsafe-eval or unsafe-inline') : ok(name, 'CSP has no unsafe-*');

  const gecko = m.browser_specific_settings?.gecko;
  if (firefox) {
    gecko?.id ? ok(name, `gecko id: ${gecko.id}`) : fail(name, 'gecko id missing');
    gecko?.strict_min_version ? ok(name, `strict_min_version: ${gecko.strict_min_version}`) : fail(name, 'strict_min_version missing');
    gecko?.data_collection_permissions?.required?.length
      ? ok(name, 'data_collection_permissions declared')
      : fail(name, 'data_collection_permissions missing (required by AMO)');
  } else if (m.browser_specific_settings) {
    fail(name, 'browser_specific_settings should only be in the Firefox build');
  }

  const files = walk(dir);
  const external = files
    .filter((f) => f.endsWith('.html'))
    .filter((f) => /<script[^>]+src=["']https?:/i.test(readFileSync(f, 'utf8')));
  external.length === 0 ? ok(name, 'no remote scripts in HTML') : fail(name, `remote scripts in: ${external.join(', ')}`);

  const size = files.reduce((sum, f) => sum + statSync(f).size, 0);
  const label = `package size ${(size / 1024).toFixed(0)} KB`;
  size < MAX_SIZE_BYTES ? ok(name, label) : fail(name, `${label} exceeds ${MAX_SIZE_BYTES / 1024 / 1024} MB`);
}

checkBuild('chromium', join(outputDir, 'chrome-mv3'), { firefox: false });
checkBuild('firefox', join(outputDir, 'firefox-mv3'), { firefox: true });

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
