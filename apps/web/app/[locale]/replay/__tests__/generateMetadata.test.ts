import { describe, expect, it, vi } from 'vitest';
import frMessages from '@/messages/fr.json';

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
import { encodeReplay } from '@/lib/replay';
import type { ReplayData } from '@typewav/types';
import { generateMetadata } from '../page';

const P = (locale: string) => Promise.resolve({ locale });
const SP = (sp: Record<string, string>) => Promise.resolve(sp);

function replayParam(overrides: Partial<ReplayData> = {}): string {
  const data: ReplayData = {
    sessionId: 's1',
    text: 'le vif renard brun',
    keystrokeTimings: [120, 130, 110],
    wpm: 82,
    accuracy: 96,
    theme: 'cyprus-sand',
    soundPack: 'piano',
    achievedAt: 1_700_000_000_000,
    ...overrides,
  };
  return encodeReplay(data);
}

describe('replay generateMetadata', () => {
  it('sans param : meta génériques, canonical et OG suivent la locale', async () => {
    const meta = await generateMetadata({
      params: P('en'),
      searchParams: SP({}),
    });
    expect(meta.alternates?.canonical).toBe(`${APP_URL}/en`);
    expect(meta.openGraph?.locale).toBe('en_US');
    expect(typeof meta.description).toBe('string');
  });

  it('replay valide : la carte annonce le WPM et la précision de la séance', async () => {
    const meta = await generateMetadata({
      params: P('fr'),
      searchParams: SP({ d: replayParam({ wpm: 82, accuracy: 96 }) }),
    });
    const og = JSON.stringify(meta.openGraph);
    expect(og).toContain('82');
    expect(og).toContain('96');
  });

  it('param corrompu : repli silencieux sur les meta génériques', async () => {
    const meta = await generateMetadata({
      params: P('fr'),
      searchParams: SP({ d: 'nope!!!' }),
    });
    expect(meta.alternates?.canonical).toBe(`${APP_URL}/fr`);
    expect(typeof meta.description).toBe('string');
  });
});
