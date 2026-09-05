'use client';

/**
 * NavLogo — wordmark "typewav" : machine à écrire (Courier Prime) pour "type",
 * élégance musicale (Fraunces italic) pour "wav".
 *
 * `alignItems: 'baseline'` sur le conteneur externe cale le bas de la marque
 * (élément remplacé, sa "baseline" est son bord bas) exactement sur la ligne
 * de base du texte : marque et wordmark partagent un seul et même socle,
 * plutôt que trois éléments juxtaposés avec leurs propres em-box. `CAP_HEIGHT`
 * fixe la hauteur de la marque sur la hauteur d'encre réelle de "type"/"wav"
 * (mesurée en navigateur, pas devinée). Toucher l'un de ces deux réglages sans
 * re-vérifier au pixel (`getBoundingClientRect` sur la marque et un marqueur
 * de largeur nulle en `vertical-align: baseline` sur le texte) réintroduit le
 * décalage que ce composant corrige.
 */

import Link from 'next/link';

interface NavLogoProps {
  locale: string;
}

const CAP_HEIGHT = 19;

export function NavLogo({ locale }: NavLogoProps) {
  return (
    <>
      <style>{`
        @keyframes logo-wave-pulse {
          0%, 100% { transform: scaleY(1); opacity: 0.85; }
          50% { transform: scaleY(1.15); opacity: 1; }
        }
        .nav-logo-bar {
          transform-origin: 50% 100%;
          animation: logo-wave-pulse 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      <Link
        href={`/${locale}`}
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 7,
          textDecoration: 'none',
          userSelect: 'none',
        }}
        className="group relative"
        aria-label="Accueil TypeWav"
      >
        {/* Glow ambient derrière le logo */}
        <div
          className="absolute left-[2px] bottom-0 w-[26px] h-[22px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-md pointer-events-none"
          style={{ backgroundColor: 'var(--color-accent)' }}
        />

        {/* Marque : 5 barres de waveform, calées sur la hauteur de capitale du wordmark */}
        <svg
          width={CAP_HEIGHT * 1.25}
          height={CAP_HEIGHT}
          viewBox="0 0 36 28"
          fill="none"
          aria-hidden="true"
          className="relative transition-transform duration-500 group-hover:scale-105"
          style={{ flexShrink: 0 }}
        >
          <rect className="nav-logo-bar" x="2" y="2" width="4" height="24" rx="2" fill="var(--color-accent)" style={{ animationDelay: '0s' }} />
          <rect className="nav-logo-bar" x="9" y="9" width="4" height="17" rx="2" fill="var(--color-accent)" style={{ animationDelay: '0.15s' }} />
          <rect className="nav-logo-bar" x="16" y="5" width="4" height="21" rx="2" fill="var(--color-accent)" style={{ animationDelay: '0.3s' }} />
          <rect className="nav-logo-bar" x="23" y="9" width="4" height="17" rx="2" fill="var(--color-accent)" style={{ animationDelay: '0.45s' }} />
          <rect className="nav-logo-bar" x="30" y="2" width="4" height="24" rx="2" fill="var(--color-accent)" style={{ animationDelay: '0.6s' }} />
        </svg>

        {/* Wordmark : une seule unité visuelle, "type" et "wav" se poursuivent sans rupture */}
        <div style={{ display: 'inline-flex', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily: 'var(--font-logo-mono)',
              color: 'var(--color-text-primary)',
              fontWeight: 700,
              fontSize: '1.9rem',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}
          >
            type
          </span>
          <span
            style={{
              fontFamily: 'var(--font-logo-serif)',
              color: 'var(--color-text-primary)',
              fontWeight: 500,
              fontStyle: 'italic',
              fontSize: '1.93rem',
              letterSpacing: '0',
              lineHeight: 1,
              marginLeft: '1px',
            }}
          >
            wav
          </span>
        </div>
      </Link>
    </>
  );
}
