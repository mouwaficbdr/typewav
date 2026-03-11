'use client';

/**
 * NavLogo — composition [▁▃▅] TypeWav█
 *
 * Utilisé dans GlobalNav et sur les pages /auth/*.
 * Client Component justifié : useEffect pour arrêter l'animation barRise après mount.
 * Spec : docs/specs/15-global-navigation.md (v2)
 */

import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface NavLogoProps {
  locale: string;
  /** Si false, le curseur clignotant est masqué (défaut : true) */
  showCursor?: boolean;
}

export function NavLogo({ locale, showCursor = true }: NavLogoProps) {
  const barsRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Arrêter l'animation après 600ms (une seule montée, puis figé)
    const timer = setTimeout(() => {
      if (barsRef.current) {
        const rects = barsRef.current.querySelectorAll('rect');
        rects.forEach((rect) => {
          (rect as SVGElement).style.animationPlayState = 'paused';
        });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Link
      href={`/${locale}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      {/* SVG égaliseur [▁▃▅] */}
      <svg
        ref={barsRef}
        width="12"
        height="14"
        viewBox="0 0 12 14"
        fill="none"
        aria-hidden="true"
        className="nav-logo-bars"
        style={{ flexShrink: 0 }}
      >
        <rect
          x="0"
          y="10"
          width="3"
          height="4"
          fill="var(--color-accent)"
          rx="0.5"
        />
        <rect
          x="4.5"
          y="6"
          width="3"
          height="8"
          fill="var(--color-accent)"
          rx="0.5"
        />
        <rect
          x="9"
          y="2"
          width="3"
          height="12"
          fill="var(--color-accent)"
          rx="0.5"
        />
      </svg>

      {/* TypeWav + curseur */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '1.125rem',
          color: 'var(--color-text-primary)',
          letterSpacing: '0.05em',
        }}
      >
        TypeWav
        {showCursor && (
          <span
            aria-hidden="true"
            className="cursor-blink"
            style={{ color: 'var(--color-accent)' }}
          >
            █
          </span>
        )}
      </span>
    </Link>
  );
}
