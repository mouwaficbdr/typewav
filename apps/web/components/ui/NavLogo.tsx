'use client';

/**
 * NavLogo — composition [▁▃▅] TypeWav█
 */

import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface NavLogoProps {
  locale: string;
  showCursor?: boolean;
}

export function NavLogo({ locale, showCursor = true }: NavLogoProps) {
  const barsRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
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
        gap: 12,
        textDecoration: 'none',
        userSelect: 'none',
      }}
      className="group"
    >
      {/* SVG égaliseur [▁▃▅] */}
      <svg
        ref={barsRef}
        width="20"
        height="24"
        viewBox="0 0 12 14"
        fill="none"
        aria-hidden="true"
        className="nav-logo-bars transition-transform duration-300 group-hover:scale-110"
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
          fontWeight: 400,
          fontSize: '1.75rem',
          color: 'var(--color-text-primary)',
          letterSpacing: '0.05em',
        }}
      >
        TypeWav
        {showCursor && (
          <span
            aria-hidden="true"
            className="cursor-blink"
            style={{ color: 'var(--color-accent)', marginLeft: '2px' }}
          >
            █
          </span>
        )}
      </span>
    </Link>
  );
}
