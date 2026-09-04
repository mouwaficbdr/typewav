import type { ReactNode } from 'react';

interface ShortcutRowProps {
  /** Les touches, déjà rendues en `<Keycap>` par l'appelant, dans l'ordre. */
  keys: ReactNode;
  description: string;
}

/**
 * ShortcutRow : une ligne de la section raccourcis : les touches à gauche
 * (gabarit fixe pour aligner les colonnes), l'effet à droite. Rendu serveur.
 */
export function ShortcutRow({ keys, description }: ShortcutRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: '10px 18px',
        padding: '12px 0',
        borderTop:
          '1px solid color-mix(in srgb, var(--color-border) 35%, transparent)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexShrink: 0,
          minWidth: '5.5rem',
        }}
      >
        {keys}
      </div>
      <p
        style={{
          margin: 0,
          flex: '1 1 16rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.92rem',
          lineHeight: 1.65,
          color: 'var(--color-text-muted)',
        }}
      >
        {description}
      </p>
    </div>
  );
}
