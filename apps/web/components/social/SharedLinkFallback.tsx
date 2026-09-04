/**
 * SharedLinkFallback : l'atterrissage quand un lien partagé (défi, replay)
 * ne se décode pas.
 *
 * Souvent le tout premier contact d'un visiteur avec TypeWav (il a cliqué le
 * lien d'un ami). Un lien cassé n'est ni sa faute ni une panne qu'il peut
 * corriger : pas de rouge d'alarme (la couleur d'une faute de frappe), pas de
 * ligne d'erreur perdue au centre. Un titre calme, une cause en gris, et un
 * seul geste : essayer le produit. Le lien « retour » classique ne convient
 * pas ici, ce visiteur n'était jamais « là ».
 */

import Link from 'next/link';

interface SharedLinkFallbackProps {
  /** Titre calme et contextuel ("Ce défi n'a pas pu se charger"). */
  title: string;
  /** La cause décodée, affichée en gris muté. */
  detail: string;
  /** Destination du CTA (accueil localisé). */
  ctaHref: string;
  /** Libellé du CTA, orienté découverte du produit. */
  ctaLabel: string;
}

export function SharedLinkFallback({
  title,
  detail,
  ctaHref,
  ctaLabel,
}: SharedLinkFallbackProps) {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-7 p-8"
      style={{ textAlign: 'center' }}
    >
      <div
        style={{
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 500,
            lineHeight: 1.2,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9rem',
            lineHeight: 1.55,
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          {detail}
        </p>
      </div>

      <Link
        href={ctaHref}
        className="shared-link-fallback-cta"
        style={{
          display: 'inline-block',
          padding: '0.7rem 1.6rem',
          border:
            '1px solid color-mix(in srgb, var(--color-accent) 45%, transparent)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          transition: 'border-color 0.15s ease',
        }}
      >
        {ctaLabel}
      </Link>
    </main>
  );
}
