/**
 * Validation for user-supplied Google Maps navigation links.
 *
 * TREK stores a non-API `google_maps_url` on places so agents and users can pin
 * a place to a real Maps listing/search without paying for a Places lookup. The
 * URL is used as an `href` / `window.open` target, so we only accept Google's
 * Maps share hosts and Google search hosts with a `/maps` path. Everything else
 * is rejected and callers fall back to ftid/place_id/coordinates.
 */
const MAX_GOOGLE_MAPS_URL_LENGTH = 2000;

export function isGoogleMapsUrl(input: string): boolean {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') return false;

  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  // maps.app.goo.gl, goo.gl/maps
  if (hostname === 'maps.app.goo.gl') return true;
  if (hostname === 'goo.gl' && pathname.startsWith('/maps')) return true;

  // maps.google.<tld> or maps.google.<sld>.<tld> — reject maps.google.evil.com
  if (/^maps\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(hostname)) return true;

  // google.*/maps (e.g. google.com/maps, www.google.co.uk/maps)
  const bare = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  return /^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(bare) && pathname.startsWith('/maps');
}

export function normalizeGoogleMapsUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_GOOGLE_MAPS_URL_LENGTH) return null;
  return isGoogleMapsUrl(trimmed) ? trimmed : null;
}
