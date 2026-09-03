import { describe, expect, it } from 'vitest';
import robots from '../robots';
import sitemap from '../sitemap';

describe('sitemap', () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it('liste chaque page publique dans les deux locales', () => {
    for (const path of ['', '/classement', '/premium', '/transparence']) {
      expect(urls).toContain(`https://typewav.app/fr${path}`);
      expect(urls).toContain(`https://typewav.app/en${path}`);
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
      expect(entry.alternates?.languages?.fr).toMatch(/^https:\/\/typewav\.app\/fr/);
      expect(entry.alternates?.languages?.en).toMatch(/^https:\/\/typewav\.app\/en/);
    }
  });
});

describe('robots', () => {
  const rules = robots();

  it('pointe vers le sitemap', () => {
    expect(rules.sitemap).toBe('https://typewav.app/sitemap.xml');
  });

  it('interdit les zones privées et l’API', () => {
    const rule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    const disallow = ([] as string[]).concat(rule?.disallow ?? []);
    expect(disallow).toEqual(
      expect.arrayContaining(['/api/', '/*/auth/', '/*/profil', '/*/results']),
    );
  });
});
