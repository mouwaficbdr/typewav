import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

import { APP_URL } from '@/lib/seo';
import { generateMetadata } from '../page';

const P = (locale: string) => Promise.resolve({ locale });

describe('classement generateMetadata', () => {
  it('canonical et OG suivent la locale de route', async () => {
    const en = await generateMetadata({ params: P('en') });
    expect(en.alternates?.canonical).toBe(`${APP_URL}/en`);
    expect(en.openGraph?.locale).toBe('en_US');

    const fr = await generateMetadata({ params: P('fr') });
    expect(fr.alternates?.canonical).toBe(`${APP_URL}/fr`);
  });

  it('déclare les alternates hreflang et une carte Open Graph', async () => {
    const meta = await generateMetadata({ params: P('fr') });
    expect(meta.alternates?.languages).toMatchObject({
      fr: `${APP_URL}/fr`,
      en: `${APP_URL}/en`,
    });
    expect(meta.openGraph).toBeTruthy();
    expect(meta.twitter).toBeTruthy();
  });
});
