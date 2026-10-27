/**
 * Turns user input into a safe absolute URL.
 * - adds https:// when no scheme is given ("github.com" -> "https://github.com/")
 * - accepts ONLY http: and https: (blocks javascript:, data:, file:, ...)
 * Returns null when the input is not a valid URL.
 */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  const candidate = raw.includes('://') ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** "https://www.example.com/a" -> "example.com" (used as a default bookmark title). */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
