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
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export function ReplayClient() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get('d');

  const [started, setStarted] = useState(false);

  const result = useMemo<
    { ok: true; data: ReplayData } | { ok: false; error: string }
  >(() => {
    if (!encoded) return { ok: false, error: 'Aucun replay dans cette URL.' };
    try {
      const data = decodeReplay(encoded);
      return { ok: true, data };
    } catch {
      return { ok: false, error: 'Lien de replay invalide ou corrompu.' };
    }
  }, [encoded]);

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
          href="/"
          style={{
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.85rem',
          }}
        >
          ← Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  const { data } = result;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
      <header className="text-center">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-accent)',
            fontSize: '2rem',
            fontWeight: 300,
            letterSpacing: '0.1em',
          }}
        >
          Replay TypeWav
        </h1>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.85rem',
            marginTop: '0.5rem',
          }}
        >
          {data.wpm} WPM · {data.accuracy.toFixed(1)}% · thème {data.theme}
        </p>
      </header>

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
            Appuyez sur la première touche pour démarrer votre session. Le
            curseur fantôme rejoue le record partagé en temps réel.
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
            Lancer
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
        href="/"
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
        }}
      >
        ← Retour à l&apos;accueil
      </Link>
    </main>
  );
}
