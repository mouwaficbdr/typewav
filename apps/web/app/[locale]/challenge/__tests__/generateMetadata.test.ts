import { describe, expect, it, vi } from 'vitest';
import frMessages from '@/messages/fr.json';

// getTranslations réel sur fr.json avec interpolation ICU minimale : les
// assertions portent sur les vraies chaînes rendues.
vi.mock('next-intl/server', () => ({
  getTranslations: async (opts?: string | { namespace?: string }) => {
    const ns = typeof opts === 'string' ? opts : opts?.namespace;
    return (key: string, values?: Record<string, unknown>) => {
      const path = ns ? `${ns}.${key}` : key;
      const raw = path
        .split('.')
        .reduce<unknown>(
          (acc, k) => (acc as Record<string, unknown>)?.[k],
          frMessages,
        );
      if (typeof raw !== 'string') return path;
      return values
        ? raw.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k]))
        : raw;
    };
  },
}));

import { APP_URL } from '@/lib/seo';
import { encodeChallenge, hashText } from '@/lib/challenge';
import type { ChallengeParams } from '@typewav/types';
import { generateMetadata } from '../page';

const P = (locale: string) => Promise.resolve({ locale });
const SP = (sp: Record<string, string>) => Promise.resolve(sp);

function challengeParam(overrides: Partial<ChallengeParams> = {}): string {
  const params: ChallengeParams = {
    textHash: hashText('le vif renard brun'),
    textB64: 'bGUgdmlmIHJlbmFyZCBicnVu',
    duration: 60_000,
    mode: 'classic',
    ...overrides,
  };
  return encodeChallenge(params);
}

describe('challenge generateMetadata', () => {
  it('sans param : meta génériques, canonical et OG suivent la locale', async () => {
    const meta = await generateMetadata({
      params: P('en'),
      searchParams: SP({}),
    });
    expect(meta.alternates?.canonical).toBe(`${APP_URL}/en`);
    expect(meta.openGraph?.locale).toBe('en_US');
    expect(typeof meta.description).toBe('string');
  });

  it('challenge valide avec un score : la carte annonce le score à battre', async () => {
    const meta = await generateMetadata({
      params: P('fr'),
      searchParams: SP({ c: challengeParam({ creatorWpm: 78 }) }),
    });
    expect(JSON.stringify(meta.openGraph)).toContain('78');
  });

  it('challenge valide sans score : titre de défi générique, pas de « undefined »', async () => {
    const meta = await generateMetadata({
      params: P('fr'),
      searchParams: SP({ c: challengeParam() }),
    });
    expect(JSON.stringify(meta.openGraph)).not.toContain('undefined');
    expect(JSON.stringify(meta.openGraph)).not.toContain('NaN');
  });

  it('param corrompu : repli silencieux sur les meta génériques', async () => {
    const meta = await generateMetadata({
      params: P('fr'),
      searchParams: SP({ c: 'pas-du-tout-du-base64!!' }),
    });
    expect(meta.alternates?.canonical).toBe(`${APP_URL}/fr`);
    expect(typeof meta.description).toBe('string');
  });
});
