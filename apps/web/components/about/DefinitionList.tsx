export interface DefinitionItem {
  term: string;
  description: string;
}

interface DefinitionListProps {
  items: DefinitionItem[];
  /**
   * 'inline' : terme et définition sur la même ligne, filet entre les paires
   * (les modes, les règles du manifeste). 'stack' : terme au-dessus, plus d'air
   * (le glossaire). En dessous de ~30rem, 'inline' repasse en pile.
   */
  variant?: 'inline' | 'stack';
}

/**
 * DefinitionList : `<dl>` sobre et éditorial, deux densités.
 *
 * Pas de cartes, pas d'icônes : un filet fin, un terme, une définition muette.
 * Rendu côté serveur.
 */
export function DefinitionList({ items, variant = 'inline' }: DefinitionListProps) {
  const stack = variant === 'stack';

  return (
    <dl style={{ margin: 0, width: '100%' }}>
      {items.map((item, i) => (
        <div
          key={item.term}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: stack ? '4px' : '6px 20px',
            flexDirection: stack ? 'column' : 'row',
            alignItems: stack ? 'stretch' : 'baseline',
            padding: stack ? '14px 0' : '12px 0',
            borderTop:
              i === 0
                ? 'none'
                : '1px solid color-mix(in srgb, var(--color-border) 35%, transparent)',
          }}
        >
          <dt
            style={{
              flexShrink: 0,
              ...(stack ? {} : { minWidth: '7.5rem' }),
              fontFamily: stack ? 'var(--font-mono)' : 'var(--font-ui)',
              fontSize: stack ? '0.8rem' : '0.92rem',
              fontWeight: stack ? 500 : 600,
              letterSpacing: stack ? '0.04em' : undefined,
              color: 'var(--color-text-primary)',
            }}
          >
            {item.term}
          </dt>
          <dd
            style={{
              margin: 0,
              // En pile (colonne), pas de flex-grow : sinon le dernier <dd>
              // s'étire verticalement et ouvre un grand vide sous la section.
              ...(stack ? {} : { flex: '1 1 16rem' }),
              fontFamily: 'var(--font-ui)',
              fontSize: stack ? '0.9rem' : '0.92rem',
              lineHeight: 1.65,
              color: 'var(--color-text-muted)',
            }}
          >
            {item.description}
          </dd>
        </div>
      ))}
    </dl>
  );
}
