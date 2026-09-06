import { describe, expect, it } from 'vitest';
import { APP_URL } from '@/lib/seo';
import robots from '../robots';
import sitemap from '../sitemap';

describe('sitemap', () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it('liste chaque page publique dans les deux locales', () => {
    for (const path of ['', '/classement', '/about']) {
      expect(urls).toContain(`${APP_URL}/fr${path}`);
      expect(urls).toContain(`${APP_URL}/en${path}`);
    }
  });

  it("n'expose ni les pages d'auth ni les pages privées", () => {
    const joined = urls.join(' ');
    expect(joined).not.toMatch(/\/auth\//);
    expect(joined).not.toMatch(/\/profil\b/);
    expect(joined).not.toMatch(/\/results\b/);
    expect(joined).not.toMatch(/\/dev-onboarding\b/);
  });

  it('chaque entrée porte les alternates hreflang fr et en', () => {
    for (const entry of entries) {
      expect(entry.alternates?.languages?.fr?.startsWith(`${APP_URL}/fr`)).toBe(
        true,
      );
      expect(entry.alternates?.languages?.en?.startsWith(`${APP_URL}/en`)).toBe(
        true,
      );
    }
  });
});

describe('robots', () => {
  const rules = robots();

  it('pointe vers le sitemap', () => {
    expect(rules.sitemap).toBe(`${APP_URL}/sitemap.xml`);
  });

  it('interdit les zones privées et l’API', () => {
    const rule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    const disallow = ([] as string[]).concat(rule?.disallow ?? []);
    expect(disallow).toEqual(
      expect.arrayContaining(['/api/', '/*/profil', '/*/results']),
    );
  });
});
