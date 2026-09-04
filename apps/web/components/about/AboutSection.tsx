import type { ReactNode } from 'react';

interface AboutSectionProps {
  /** Numéro affiché en tête de rubrique ('01', '02', ...). */
  index: string;
  /** Libellé de rubrique, court ; mis en capitales par le style. */
  label: string;
  children: ReactNode;
}

/**
 * AboutSection : une rubrique numérotée de la page About.
 *
 * En-tête façon front-matter de magazine : numéro en mono muté, libellé accent
 * en capitales espacées, filet fin au-dessus. Le corps est libre. Aucun état,
 * rendu côté serveur.
 */
export function AboutSection({ index, label, children }: AboutSectionProps) {
  return (
    <section
      style={{
        width: '100%',
        borderTop:
          '1px solid color-mix(in srgb, var(--color-border) 55%, transparent)',
        paddingTop: '30px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.1em',
          }}
        >
          {index}
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
          }}
        >
          {label}
        </h2>
      </div>
      {children}
    </section>
  );
}
