import { describe, expect, it } from 'vitest';
import { getSecurityHeaders } from '../security-headers';

function csp(dev: boolean): string {
  return (
    getSecurityHeaders({ dev }).find(
      (h) => h.key === 'Content-Security-Policy',
    )?.value ?? ''
  );
}

describe('getSecurityHeaders', () => {
  it('expose toutes les clés de sécurité attendues', () => {
    const keys = getSecurityHeaders({ dev: false }).map((h) => h.key);
    for (const expected of [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ]) {
      expect(keys).toContain(expected);
    }
  });

  it('HSTS : max-age long, includeSubDomains, preload', () => {
    const hsts = getSecurityHeaders({ dev: false }).find(
      (h) => h.key === 'Strict-Transport-Security',
    )?.value;
    expect(hsts).toMatch(/max-age=\d{7,}/);
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });

  it('X-Frame-Options DENY et X-Content-Type-Options nosniff', () => {
    const headers = getSecurityHeaders({ dev: false });
    expect(headers.find((h) => h.key === 'X-Frame-Options')?.value).toBe('DENY');
    expect(
      headers.find((h) => h.key === 'X-Content-Type-Options')?.value,
    ).toBe('nosniff');
  });

  it('Permissions-Policy coupe caméra, micro et géolocalisation', () => {
    const pp =
      getSecurityHeaders({ dev: false }).find(
        (h) => h.key === 'Permissions-Policy',
      )?.value ?? '';
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('geolocation=()');
  });

  it('CSP : directives de base présentes', () => {
    const value = csp(false);
    expect(value).toContain("default-src 'self'");
    expect(value).toContain("frame-ancestors 'none'");
    expect(value).toContain("frame-src 'none'");
    expect(value).toContain("object-src 'none'");
    expect(value).toContain("base-uri 'self'");
    expect(value).toContain("form-action 'self'");
  });

  it('CSP : aucune origine Stripe (chemin payant retiré)', () => {
    const value = csp(false);
    expect(value).not.toContain('stripe.com');
  });

  it('CSP : autorise les origines externes réellement contactées (samples Tone.js, Supabase)', () => {
    const value = csp(false);
    expect(value).toMatch(/connect-src[^;]*https:\/\/tonejs\.github\.io/);
    expect(value).toMatch(/connect-src[^;]*\.supabase\.co/);
    expect(value).toMatch(/media-src[^;]*https:\/\/tonejs\.github\.io/);
    expect(value).toContain('worker-src');
  });

  it("CSP de production n'autorise pas 'unsafe-eval'", () => {
    expect(csp(false)).not.toContain("'unsafe-eval'");
  });

  it("CSP de dev autorise 'unsafe-eval' (React Refresh / Turbopack HMR)", () => {
    expect(csp(true)).toContain("'unsafe-eval'");
  });
});
