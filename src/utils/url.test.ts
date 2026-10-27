import { describe, expect, it } from 'vitest';
import { hostnameOf, normalizeUrl } from './url';

describe('normalizeUrl', () => {
  it('adds https:// when the scheme is missing', () => {
    expect(normalizeUrl('github.com')).toBe('https://github.com/');
  });
  it('keeps http and https URLs', () => {
    expect(normalizeUrl('http://example.com/a?b=1')).toBe('http://example.com/a?b=1');
  });
  it('rejects dangerous or invalid input', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('javascript://%0Aalert(1)')).toBeNull();
    expect(normalizeUrl('data:text/html,hi')).toBeNull();
    expect(normalizeUrl('file:///etc/passwd')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('two words')).toBeNull();
  });
});

describe('hostnameOf', () => {
  it('strips www.', () => {
    expect(hostnameOf('https://www.example.com/x')).toBe('example.com');
  });
});
