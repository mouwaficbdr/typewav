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
import { useAudioEngine } from '@/hooks/useAudioEngine';
import {
  decodeChallenge,
  generateChallengeLink,
  getChallengeText,
  hashText,
} from '@/lib/challenge';
import type { ChallengeParams, TypingMode } from '@typewav/types';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const SUPPORTED_CHALLENGE_MODES: readonly TypingMode[] = [
  'classic',
  'sprint',
  'quote',
  'zen',
  'code',
  'custom',
  'ghost',
  'challenge',
];

export function ChallengeClient() {
  const t = useTranslations('challenge');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const encoded = searchParams.get('c');
  const { loadMidiPiece } = useAudioEngine();

  const [completed, setCompleted] = useState(false);
  const [userWpm, setUserWpm] = useState<number | null>(null);

  const result = useMemo<
    | { ok: true; params: ChallengeParams; text: string }
    | { ok: false; error: string }
  >(() => {
    if (!encoded) return { ok: false, error: t('noChallengeInUrl') };
    try {
      const params = decodeChallenge(encoded);
      if (!SUPPORTED_CHALLENGE_MODES.includes(params.mode)) {
        return { ok: false, error: t('invalidOrExpiredLink') };
      }
      const text = getChallengeText(params);
      // Vérifier l'intégrité du texte
      if (hashText(text) !== params.textHash) {
        return { ok: false, error: t('challengeTextAltered') };
      }
      return { ok: true, params, text };
    } catch {
      return { ok: false, error: t('invalidOrExpiredLink') };
    }
  }, [encoded, t]);

  useEffect(() => {
    if (!result.ok) return;
    void loadMidiPiece('fur-elise');
  }, [loadMidiPiece, result.ok]);

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
      {/* Banner slim contextuel */}
      <div
        style={{
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          letterSpacing: '0.05em',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {params.creatorWpm !== undefined
          ? t('bannerWithTarget', { target: params.creatorWpm })
          : t('banner')}
      </div>

      {!completed ? (
        <TypingArea
          text={text}
          mode={params.mode}
          durationSeconds={params.duration}
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
                  {t('wonWithWpm', { wpm: userWpm })}
                </span>
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {t('remainingToBeat', {
                    wpm: userWpm,
                    remaining: params.creatorWpm - userWpm,
                  })}
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
              {t('retry')}
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
                {t('counterChallenge')}
              </Link>
            )}
          </div>

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
        </div>
      )}
    </main>
  );
}
