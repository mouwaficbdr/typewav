'use client';

/**
 * PremiumPageClient — page de tarification et checkout Stripe.
 *
 * Client Component justifié : état interactif, appel API Stripe.
 * Spec : docs/specs/00-project-overview.md — Monétisation Phase 4
 */

import { useUser } from '@/hooks/useUser';
import { SYNC_IS_COMING_SOON } from '@/lib/featureFlags';
import { STRIPE_PLANS } from '@/lib/stripe';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

const PREMIUM_FEATURES = [
  {
    emoji: '🎹',
    label: 'Pack Cinematic — cordes + piano',
    premium: true,
    comingSoon: false,
  },
  {
    emoji: '🎸',
    label: 'Pack Phonk — synthés sombres',
    premium: true,
    comingSoon: false,
  },
  {
    emoji: '🎷',
    label: 'Pack Jazz Piano — swing',
    premium: true,
    comingSoon: false,
  },
  {
    emoji: '🎵',
    label: 'Mode Classiques MIDI',
    premium: false,
    comingSoon: false,
  },
  {
    emoji: '📊',
    label: 'Dashboard analytics complet',
    premium: false,
    comingSoon: false,
  },
  {
    emoji: '👻',
    label: 'Ghost mode — record personnel',
    premium: false,
    comingSoon: false,
  },
  {
    emoji: '🔗',
    label: 'Replay partageable',
    premium: false,
    comingSoon: false,
  },
  {
    emoji: '⚔️',
    label: 'Challenge direct par lien',
    premium: false,
    comingSoon: false,
  },
  {
    emoji: '☁️',
    label: 'Sync cloud tous appareils',
    premium: true,
    comingSoon: true,
  },
];

export function PremiumPageClient() {
  const { user, isPremium, loading } = useUser();
  const t = useTranslations('sync');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: keyof typeof STRIPE_PLANS) => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du checkout');
      }

      const data = (await response.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error ?? 'URL de paiement manquante');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
        }}
      >
        Chargement…
      </div>
    );
  }

  if (isPremium) {
    return (
      <main
        className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="text-center">
          <p
            style={{
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
            }}
          >
            ✦ Vous êtes Premium
          </p>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              marginTop: '8px',
            }}
          >
            Tous les packs sonores et fonctionnalités cloud sont débloqués.
          </p>
        </div>
        <Link
          href="/"
          style={{
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            textDecoration: 'underline',
          }}
        >
          ← Retour au typing
        </Link>
      </main>
    );
  }

  return (
    <main
      className="flex min-h-dvh flex-col items-center gap-12 p-8 pt-16"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <header className="text-center">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3rem',
            fontWeight: '300',
            color: 'var(--color-text-primary)',
            letterSpacing: '0.05em',
          }}
        >
          TypeWav Premium
        </h1>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
            marginTop: '8px',
          }}
        >
          Des sons cinématiques. Votre musique, votre rythme.
        </p>
      </header>

      {/* Liste des fonctionnalités */}
      <ul
        className="flex flex-col gap-3"
        style={{ maxWidth: '480px', width: '100%' }}
      >
        {PREMIUM_FEATURES.map((f) => (
          <li
            key={f.label}
            className="flex items-center gap-3"
            style={{
              color: f.premium
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.9375rem',
            }}
          >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
            {f.premium && !f.comingSoon && (
              <span
                style={{
                  backgroundColor: 'var(--color-accent)',
                  borderRadius: '3px',
                  color: 'var(--color-bg)',
                  fontSize: '0.625rem',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  marginLeft: 'auto',
                  padding: '2px 6px',
                }}
              >
                PREMIUM
              </span>
            )}
            {f.comingSoon && SYNC_IS_COMING_SOON && (
              <span
                aria-label={t('comingSoon')}
                style={{
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '12px',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  marginLeft: 'auto',
                  padding: '2px 8px',
                  textTransform: 'uppercase',
                }}
              >
                {t('comingSoon')}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Note sync coming soon */}
      {SYNC_IS_COMING_SOON && (
        <p
          role="status"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            padding: '12px 16px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            maxWidth: '480px',
            width: '100%',
          }}
        >
          {t('comingSoonExplainer')}
        </p>
      )}

      {/* Tarification */}
      <div className="flex flex-wrap justify-center gap-6">
        {/* Plan mensuel */}
        <div
          className="flex flex-col items-center gap-4 rounded-md p-8"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            minWidth: '200px',
          }}
        >
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Mensuel
          </p>
          <p
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            4,99 €
          </p>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
            }}
          >
            par mois · sans engagement
          </p>
          <button
            onClick={() => void handleCheckout('monthly')}
            disabled={checkoutLoading}
            style={{
              backgroundColor: 'var(--color-border)',
              border: '1px solid var(--color-accent)',
              borderRadius: '4px',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              fontWeight: '600',
              letterSpacing: '0.05em',
              padding: '10px 20px',
              textTransform: 'uppercase',
              width: '100%',
            }}
          >
            {checkoutLoading ? '…' : user ? 'Souscrire' : 'Se connecter'}
          </button>
        </div>

        {/* Plan annuel */}
        <div
          className="flex flex-col items-center gap-4 rounded-md p-8"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-accent)',
            minWidth: '200px',
            position: 'relative',
          }}
        >
          <span
            style={{
              backgroundColor: 'var(--color-accent)',
              borderRadius: '3px',
              color: 'var(--color-bg)',
              fontSize: '0.625rem',
              fontWeight: '700',
              letterSpacing: '0.05em',
              padding: '3px 8px',
              position: 'absolute',
              top: '-14px',
            }}
          >
            MEILLEUR PRIX · −33 %
          </span>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Annuel
          </p>
          <p
            style={{
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            39,99 €
          </p>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
            }}
          >
            par an · 3,33 €/mois
          </p>
          <button
            onClick={() => void handleCheckout('annual')}
            disabled={checkoutLoading}
            style={{
              backgroundColor: 'var(--color-accent)',
              border: 'none',
              borderRadius: '4px',
              color: 'var(--color-bg)',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              fontWeight: '600',
              letterSpacing: '0.05em',
              padding: '10px 20px',
              textTransform: 'uppercase',
              width: '100%',
            }}
          >
            {checkoutLoading ? '…' : user ? 'Souscrire' : 'Se connecter'}
          </button>
        </div>
      </div>

      {error && (
        <p
          style={{
            color: 'var(--color-error)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </p>
      )}

      <div className="flex gap-6">
        <Link
          href="/"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
          }}
        >
          ← Retour
        </Link>
        <Link
          href="/transparence"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
          }}
        >
          Transparence financière →
        </Link>
      </div>
    </main>
  );
}
