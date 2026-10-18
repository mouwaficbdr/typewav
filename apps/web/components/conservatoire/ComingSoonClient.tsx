'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { HomeRowTeaser } from './HomeRowTeaser';

const PROMISE_KEYS = ['promise1', 'promise2', 'promise3'] as const;

/**
 * ComingSoonClient : page éditoriale « à venir » du Conservatoire.
 *
 * Pas une bannière « coming soon » : kicker, phrase de tête en display, trois
 * promesses numérotées en mono, une seule action. L'avant-goût jouable
 * (`HomeRowTeaser`, tâche 5 du plan) prend place sous la légende `teaser`.
 * Colonne de lecture centrée sur la page ; à l'intérieur, tout reste aligné
 * à gauche (contrainte de la spec). Le mot `bientôt` sort du kicker discret
 * pour devenir un cachet tourné, posé comme un vrai tampon « à venir ».
 */
export function ComingSoonClient() {
  const t = useTranslations('comingSoon');
  const locale = useLocale();
  const router = useRouter();
  const reduceMotion = useReducedMotion() === true;

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
        maxWidth: '760px',
        margin: '0 auto',
        padding: 'clamp(24px, 5vw, 48px) clamp(20px, 6vw, 56px) 96px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '44px',
      }}
    >
      <header
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
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
        </div>

        {/* Cachet « bientôt » : la promesse sort du kicker discret pour
            devenir le seul geste de couleur de la page, tourné comme un vrai
            tampon posé de travers. Deux anneaux (plein, pointillé) pour la
            texture de sceau plutôt qu'un badge plein. Décoratif : le mot
            vit déjà dans `kicker`, lu par un lecteur d'écran. */}
        <motion.div
          aria-hidden="true"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.4, rotate: 4 }}
          animate={{ opacity: 1, scale: 1, rotate: -9 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            flexShrink: 0,
            position: 'relative',
            width: 'clamp(76px, 11vw, 96px)',
            height: 'clamp(76px, 11vw, 96px)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid var(--color-accent)',
          }}
        >
          <span
            style={{
              position: 'absolute',
              inset: '6px',
              borderRadius: '50%',
              border: '1px dashed color-mix(in srgb, var(--color-accent) 55%, transparent)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.62rem, 1.4vw, 0.72rem)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              textAlign: 'center',
              lineHeight: 1.25,
              padding: '0 6px',
            }}
          >
            {t('badge')}
          </span>
        </motion.div>
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
        <HomeRowTeaser />
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
