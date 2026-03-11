'use client';

/**
 * ChallengeClient — page de challenge partagé.
 *
 * Décode les params depuis l'URL (?c=...) et lance un test
 * avec le texte du créateur. Affiche le WPM cible si fourni.
 *
 * Spec : docs/specs/08 — Challenge direct
 * 'use client' justifié : useSearchParams (hook React), TypingArea (interactif)
 */

import { TypingArea } from '@/components/typing/TypingArea';
import {
  decodeChallenge,
  generateChallengeLink,
  getChallengeText,
  hashText,
} from '@/lib/challenge';
import type { ChallengeParams } from '@typewav/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export function ChallengeClient() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get('c');

  const [completed, setCompleted] = useState(false);
  const [userWpm, setUserWpm] = useState<number | null>(null);

  const result = useMemo<
    | { ok: true; params: ChallengeParams; text: string }
    | { ok: false; error: string }
  >(() => {
    if (!encoded)
      return { ok: false, error: 'Aucun challenge trouvé dans cette URL.' };
    try {
      const params = decodeChallenge(encoded);
      const text = getChallengeText(params);
      // Vérifier l'intégrité du texte
      if (hashText(text) !== params.textHash) {
        return { ok: false, error: 'Le texte du challenge a été altéré.' };
      }
      return { ok: true, params, text };
    } catch {
      return { ok: false, error: 'Lien de challenge invalide ou expiré.' };
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

  const { params, text } = result;

  function handleComplete(wpm: number) {
    setUserWpm(wpm);
    setCompleted(true);
  }

  // Générer un lien de défi en retour
  const challengeBackLink =
    userWpm !== null
      ? generateChallengeLink(text, {
          duration: params.duration,
          mode: params.mode,
          creatorWpm: userWpm,
        })
      : null;

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
          Challenge TypeWav
        </h1>
        {params.creatorWpm !== undefined && (
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              marginTop: '0.5rem',
            }}
          >
            Objectif : battre{' '}
            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              {params.creatorWpm} WPM
            </span>
          </p>
        )}
      </header>

      {!completed ? (
        <TypingArea
          text={text}
          mode={params.mode}
          onComplete={handleComplete}
          autoNavigate={false}
        />
      ) : (
        <div
          className="flex flex-col items-center gap-6"
          style={{ textAlign: 'center' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-primary)',
              fontSize: '1.5rem',
            }}
          >
            {params.creatorWpm !== undefined && userWpm !== null ? (
              userWpm >= params.creatorWpm ? (
                <span style={{ color: 'var(--color-accent)' }}>
                  ✓ Gagné — {userWpm} WPM !
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {userWpm} WPM — encore {params.creatorWpm - userWpm} WPM à
                  gagner
                </span>
              )
            ) : (
              <span>{userWpm} WPM</span>
            )}
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setCompleted(false)}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Réessayer
            </button>

            {challengeBackLink && (
              <Link
                href={challengeBackLink}
                style={{
                  background: 'var(--color-accent)',
                  color: '#000',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.8rem',
                  padding: '0.5rem 1rem',
                  textDecoration: 'none',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Contre-défier
              </Link>
            )}
          </div>

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
        </div>
      )}
    </main>
  );
}
