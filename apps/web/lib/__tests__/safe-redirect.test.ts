import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from '../safe-redirect';

describe('getSafeRedirectPath', () => {
  it('returns the path unchanged when it is a plain internal path', () => {
    expect(getSafeRedirectPath('/premium')).toBe('/premium');
  });

  it('defaults to / when next is null', () => {
    expect(getSafeRedirectPath(null)).toBe('/');
  });

  it('defaults to / when next is an empty string', () => {
    expect(getSafeRedirectPath('')).toBe('/');
  });

  it('rejects a userinfo-style host hijack (?next=@evil.com)', () => {
    expect(getSafeRedirectPath('@evil.com')).toBe('/');
  });

  it('rejects a subdomain hijack (?next=.evil.com)', () => {
    expect(getSafeRedirectPath('.evil.com')).toBe('/');
  });

  it('rejects a protocol-relative URL (//evil.com)', () => {
    expect(getSafeRedirectPath('//evil.com')).toBe('/');
  });

  it('rejects a backslash-based protocol-relative URL (/\\evil.com)', () => {
    expect(getSafeRedirectPath('/\\evil.com')).toBe('/');
  });

  it('rejects an absolute external URL', () => {
    expect(getSafeRedirectPath('https://evil.com')).toBe('/');
  });
});
