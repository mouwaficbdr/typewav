import type { ReactNode } from 'react';

interface KeycapProps {
  /** Le libellé de la touche : un mot ("Tab"), un glyphe ("↵", "⌫"). */
  children: ReactNode;
  /**
   * 'sm' pour l'inline dans un paragraphe, 'md' pour une liste de raccourcis.
   */
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = {
  sm: { fontSize: '0.72rem', minWidth: '1.5em', padding: '1px 6px 2px', skirt: 2 },
  md: { fontSize: '0.82rem', minWidth: '2.2em', padding: '4px 10px 5px', skirt: 3 },
} as const;

/**
 * Keycap : rendu « touche de clavier » réutilisable.
 *
 * `<kbd>` sémantique. Le relief vient d'une jupe (bordure basse épaisse) et
 * d'un liseré clair en haut, pas d'une ombre portée générique : une vraie
 * touche, pas un badge. Purement présentationnel et sans état interactif ici ;
 * `className` reste ouvert pour qu'un consommateur ajoute un `:active` quand il
 * le câble dans une zone de frappe. Toutes les couleurs passent par les tokens
 * de thème, donc la touche suit le thème actif.
 */
export function Keycap({ children, size = 'md', className }: KeycapProps) {
  const dims = SIZES[size];

  return (
    <kbd
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: dims.minWidth,
        padding: dims.padding,
        fontFamily: 'var(--font-mono)',
        fontSize: dims.fontSize,
        fontWeight: 500,
        lineHeight: 1,
        color: 'var(--color-text-primary)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderBottomWidth: dims.skirt,
        borderRadius: 'var(--radius-sm)',
        boxShadow:
          'inset 0 1px 0 color-mix(in srgb, var(--color-text-primary) 12%, transparent), 0 1px 1px color-mix(in srgb, var(--color-bg) 55%, transparent)',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        userSelect: 'none',
      }}
    >
      {children}
    </kbd>
  );
}
