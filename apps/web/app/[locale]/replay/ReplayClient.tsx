'use client';

/**
 * ReplayClient — lecture d'un replay partageable.
 *
 * Décode les données depuis l'URL (?d=...) et affiche TypingArea
 * avec le ghost cursor rejouant le record partagé.
 *
 * Spec : docs/specs/08 — Replay partageable
 * 'use client' justifié : useSearchParams, état interactif, TypingArea
 */

import { TypingArea } from '@/components/typing/TypingArea';
import { decodeReplay } from '@/lib/replay';
import type { ReplayData } from '@typewav/types';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export function ReplayClient() {
  const t = useTranslations('replay');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const encoded = searchParams.get('d');

  const [started, setStarted] = useState(false);

  const result = useMemo<
    { ok: true; data: ReplayData } | { ok: false; error: string }
  >(() => {
    if (!encoded) return { ok: false, error: t('missingReplayInUrl') };
    try {
      const data = decodeReplay(encoded);
      return { ok: true, data };
    } catch {
      return { ok: false, error: t('invalidOrCorruptedLink') };
    }
  }, [encoded, t]);

  if (!result.ok) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8">
        <p
          style={{
            color: 'var(--color-error)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9rem',
          }}
        >
          {result.error}
        </p>
        <Link
          href={`/${locale}`}
          style={{
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.85rem',
          }}
        >
          {t('backHome')}
        </Link>
      </main>
    );
  }

  const { data } = result;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
      {/* Banner slim */}
      <div
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {t('banner', {
          wpm: data.wpm,
          accuracy: data.accuracy.toFixed(1),
          theme: data.theme,
        })}
      </div>

      {!started ? (
        <div className="flex flex-col items-center gap-6">
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.9rem',
              textAlign: 'center',
              maxWidth: '480px',
            }}
          >
            {t('preLaunchDescription')}
          </p>
          <button
            onClick={() => setStarted(true)}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-accent)',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8rem',
              padding: '0.75rem 2rem',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {t('launch')}
          </button>
        </div>
      ) : (
        <TypingArea
          text={data.text}
          mode="ghost"
          ghostTimings={data.keystrokeTimings}
        />
      )}

      <Link
        href={`/${locale}`}
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
        }}
      >
        {t('backHome')}
      </Link>
    </main>
  );
}
