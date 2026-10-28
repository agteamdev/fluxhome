/**
 * Finding and downloading site icons.
 * Icons are requested directly from the bookmarked site (never from a third-party icon service),
 * shrunk to 32x32 and stored as data URLs.
 */

const MAX_DOWNLOAD_BYTES = 200 * 1024;
const MAX_RAW_ICON_BYTES = 30 * 1024;
const TIMEOUT_MS = 6000;

function attribute(tag: string, name: string): string | undefined {
  const match = new RegExp(`(?<![\\w-])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

/**
 * Icon addresses declared in a page's <link> tags, best first
 * (closest to 32 px wins; apple-touch-icons are a little less preferred).
 */
export function parseIconLinks(html: string, baseUrl: string): string[] {
  const found: { url: string; score: number }[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attribute(tag, 'rel') ?? '').toLowerCase().split(/\s+/);
    const isApple = rel.includes('apple-touch-icon') || rel.includes('apple-touch-icon-precomposed');
    if (!rel.includes('icon') && !isApple) continue;

    const href = attribute(tag, 'href');
    if (!href) continue;
    let url: URL;
    try {
      url = new URL(href, baseUrl);
    } catch {
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;

    const sizes = attribute(tag, 'sizes') ?? '';
    const size = /(\d+)x\d+/i.exec(sizes)?.[1];
    const pixels = size ? Number(size) : sizes.toLowerCase() === 'any' ? 32 : 16;
    found.push({ url: url.href, score: Math.abs(pixels - 32) + (isApple ? 20 : 0) });
  }
  found.sort((a, b) => a.score - b.score);
  return [...new Set(found.map((f) => f.url))];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function download(url: string): Promise<Response | null> {
  try {
    const response = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(TIMEOUT_MS) });
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

/** Downloads one icon and converts it to a small data URL (or null if it is not a usable image). */
async function fetchIcon(url: string): Promise<string | null> {
  const response = await download(url);
  if (!response) return null;
  const blob = await response.blob();
  if (blob.size === 0 || blob.size > MAX_DOWNLOAD_BYTES || !blob.type.startsWith('image/')) return null;

  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(32, 32);
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(bitmap, 0, 0, 32, 32);
      bitmap.close();
      return await blobToDataUrl(await canvas.convertToBlob({ type: 'image/png' }));
    }
  } catch {
    // The browser cannot decode this format into a bitmap (e.g. SVG): keep it as is if it is small
  }
  return blob.size <= MAX_RAW_ICON_BYTES ? blobToDataUrl(blob) : null;
}

/** Finds the icon of the site that `pageUrl` belongs to. Returns a data URL, or null if none was found. */
export async function fetchFavicon(pageUrl: string): Promise<string | null> {
  let origin: string;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return null;
  }

  const direct = await fetchIcon(`${origin}/favicon.ico`);
  if (direct) return direct;

  // Many sites only declare their icon in the page itself
  const page = await download(pageUrl);
  if (!page || !(page.headers.get('content-type') ?? '').includes('html')) return null;
  const html = (await page.text()).slice(0, 300_000);
  for (const href of parseIconLinks(html, pageUrl).slice(0, 3)) {
    const icon = await fetchIcon(href);
    if (icon) return icon;
  }
  return null;
}
