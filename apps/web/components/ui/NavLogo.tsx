'use client';

/**
 * NavLogo — Refonte Premium : Logo "W" Waveform + Typographie hybride
 */

import Link from 'next/link';

interface NavLogoProps {
  locale: string;
}

export function NavLogo({ locale }: NavLogoProps) {
  return (
    <>
      <style>{`
        @keyframes logo-wave-pulse {
          0%, 100% { transform: scaleY(1); opacity: 0.8; }
          50% { transform: scaleY(1.15); opacity: 1; }
        }
        .nav-logo-bar {
          transform-origin: 50% 50%;
          animation: logo-wave-pulse 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      <Link
        href={`/${locale}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          userSelect: 'none',
        }}
        className="group relative"
        aria-label="Accueil TypeWav"
      >
        {/* Glow ambient derrière le logo */}
        <div
          className="absolute left-[4px] top-1/2 -translate-y-1/2 w-[28px] h-[22px] rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-md pointer-events-none"
          style={{ backgroundColor: 'var(--color-accent)' }}
        />

        {/* SVG Waveform formant un "W" */}
        <svg
          width="28"
          height="22"
          viewBox="0 0 36 28"
          fill="none"
          aria-hidden="true"
          className="relative transition-transform duration-500 group-hover:scale-105"
          style={{ flexShrink: 0 }}
        >
          <rect
            className="nav-logo-bar"
            x="2"
            y="2"
            width="4"
            height="24"
            rx="2"
            fill="var(--color-accent)"
            style={{ animationDelay: '0s' }}
          />
          <rect
            className="nav-logo-bar"
            x="9"
            y="9"
            width="4"
            height="10"
            rx="2"
            fill="var(--color-accent)"
            style={{ animationDelay: '0.15s' }}
          />
          <rect
            className="nav-logo-bar"
            x="16"
            y="5"
            width="4"
            height="18"
            rx="2"
            fill="var(--color-accent)"
            style={{ animationDelay: '0.3s' }}
          />
          <rect
            className="nav-logo-bar"
            x="23"
            y="9"
            width="4"
            height="10"
            rx="2"
            fill="var(--color-accent)"
            style={{ animationDelay: '0.45s' }}
          />
          <rect
            className="nav-logo-bar"
            x="30"
            y="2"
            width="4"
            height="24"
            rx="2"
            fill="var(--color-accent)"
            style={{ animationDelay: '0.6s' }}
          />
        </svg>

        {/* Typographie de la marque (Hybride) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          {/* "Type" : Aspect Tech / Clavier (Sora - Bold) */}
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              color: 'var(--color-text-primary)',
              fontWeight: 700,
              fontSize: '1.75rem',
              letterSpacing: '-0.04em',
            }}
          >
            type
          </span>
          {/* "Wav" : Aspect Musique / Élégance (Cormorant - Italic) */}
          <span
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              fontStyle: 'italic',
              fontSize: '2.5rem',
              letterSpacing: '0.02em',
              marginLeft: '-2px',
            }}
          >
            wav
          </span>
        </div>
      </Link>
    </>
  );
}
