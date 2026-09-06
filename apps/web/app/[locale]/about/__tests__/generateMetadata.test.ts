import { describe, expect, it, vi } from 'vitest';

// getTranslations mocké : `t(key)` renvoie la clé (convention du repo).
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

import { APP_URL } from '@/lib/seo';
import { generateMetadata } from '../page';

describe('about generateMetadata', () => {
  it('canonical et OG suivent la locale de route (en)', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: 'en' }),
    });
    expect(meta.alternates?.canonical).toBe(`${APP_URL}/en`);
    expect(meta.openGraph?.locale).toBe('en_US');
  });

  it('canonical suit la locale de route (fr)', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: 'fr' }),
    });
    expect(meta.alternates?.canonical).toBe(`${APP_URL}/fr`);
  });

  it('une locale inconnue retombe sur la locale par défaut', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ locale: 'de' }),
    });
    expect(meta.alternates?.canonical).toBe(`${APP_URL}/fr`);
  });
});
