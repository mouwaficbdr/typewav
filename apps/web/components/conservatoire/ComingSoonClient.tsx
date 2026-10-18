'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PROMISE_KEYS = ['promise1', 'promise2', 'promise3'] as const;

/**
 * ComingSoonClient : page éditoriale « à venir » du Conservatoire.
 *
 * Pas une bannière « coming soon » : kicker, phrase de tête en display, trois
 * promesses numérotées en mono, une seule action. L'avant-goût jouable
 * (`HomeRowTeaser`, tâche 5 du plan) prend place sous la légende `teaser`.
 */
export function ComingSoonClient() {
  const t = useTranslations('comingSoon');
  const locale = useLocale();
  const router = useRouter();

  // Entrée n'importe où (sauf si le focus est déjà sur une commande, qui gère
  // alors Entrée elle-même) mène à l'accueil, comme le lien principal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key !== 'Enter' ||
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      const el = document.activeElement;
      if (
        el &&
        ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
      )
        return;
      router.push(`/${locale}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, locale]);

  return (
    <main
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(20px, 6vw, 56px) 96px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '44px',
      }}
    >
      <header style={{ width: '100%' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('kicker')}
        </p>
        <h1
          style={{
            margin: '14px 0 0',
            maxWidth: '60%',
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: 'clamp(2.4rem, 7vw, 3.6rem)',
            lineHeight: 1.08,
            letterSpacing: '0.01em',
            color: 'var(--color-text-primary)',
          }}
        >
          {t('title')}
        </h1>
      </header>

      <ol
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          width: '100%',
        }}
      >
        {PROMISE_KEYS.map((key, i) => (
          <li
            key={key}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '14px',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.1em',
                flexShrink: 0,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.98rem',
                lineHeight: 1.7,
                color: 'var(--color-text-primary)',
              }}
            >
              {t(key)}
            </span>
          </li>
        ))}
      </ol>

      <div style={{ width: '100%' }}>
        <p
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.95rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {t('teaser')}
        </p>
        {/* HomeRowTeaser (tâche 5) prend place ici. */}
      </div>

      <Link
        href={`/${locale}`}
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: '1.5rem',
          fontWeight: 400,
          color: 'var(--color-text-primary)',
          textDecoration: 'none',
        }}
        className="hover:text-[var(--color-accent)] transition-colors"
      >
        {t('cta')} <span aria-hidden="true">&rarr;</span>
      </Link>
    </main>
  );
}
