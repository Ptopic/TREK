import { describe, it, expect } from 'vitest';
import { isGoogleMapsUrl, normalizeGoogleMapsUrl } from './googleMaps';

describe('isGoogleMapsUrl', () => {
  it('accepts Google Maps share and search hosts', () => {
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc123')).toBe(true);
    expect(isGoogleMapsUrl('https://goo.gl/maps/xyz')).toBe(true);
    expect(isGoogleMapsUrl('https://maps.google.com/?q=eiffel')).toBe(true);
    expect(isGoogleMapsUrl('https://www.google.com/maps/search/?api=1&query=Palma%20Cathedral')).toBe(true);
  });

  it('rejects non-Google hosts, javascript: URLs, and bare text', () => {
    expect(isGoogleMapsUrl('https://evil.example/?q=Palma')).toBe(false);
    expect(isGoogleMapsUrl('javascript:alert(1)')).toBe(false);
    expect(isGoogleMapsUrl('ftp://maps.app.goo.gl/abc123')).toBe(false);
    expect(isGoogleMapsUrl('http://maps.google.com/?q=Palma')).toBe(false);
    expect(isGoogleMapsUrl('Palma Cathedral')).toBe(false);
    expect(isGoogleMapsUrl('https://maps.google.evil.com/maps')).toBe(false);
    expect(isGoogleMapsUrl('https://google.com/search?q=Palma')).toBe(false);
  });

  it('trims whitespace before parsing', () => {
    expect(isGoogleMapsUrl('  https://maps.app.goo.gl/abc123  ')).toBe(true);
  });
});

describe('normalizeGoogleMapsUrl', () => {
  it('returns a trimmed valid URL and null otherwise', () => {
    expect(normalizeGoogleMapsUrl(' https://maps.google.com/?q=Palma ')).toBe('https://maps.google.com/?q=Palma');
    expect(normalizeGoogleMapsUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeGoogleMapsUrl(null)).toBeNull();
    expect(normalizeGoogleMapsUrl(undefined)).toBeNull();
  });
});
