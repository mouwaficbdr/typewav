'use client';

/**
 * CollectionSelector — sélecteur de collection de textes (Poésie,
 * Philosophie, Gaming, Code, Littérature). Calqué sur le menu déroulant de
 * ContextSelectors (langue) : un bouton compact qui déplie la liste des
 * collections disponibles.
 */

import { BookIcon } from '@/components/ui/icons';
import { useConfigStore } from '@/stores/useConfigStore';
import type { TypingMode } from '@typewav/types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const COLLECTIONS = [
  'litterature',
  'poesie',
  'philosophie',
  'gaming',
  'code',
] as const;

// 'code' est volontairement absent : ce mode garantit du vrai code (voir
// l'effet d'auto-bascule dans HomeClient) et rien ne doit permettre à
// l'utilisateur de faire dériver la collection ailleurs pendant qu'il est
// actif — sinon "Code" reste affiché tout en montrant un texte quelconque.
const MODES_WITH_COLLECTION: readonly TypingMode[] = [
  'classic',
  'sprint',
  'zen',
  'quote',
];

export function CollectionSelector() {
  const activeCollection = useConfigStore((s) => s.activeCollection);
  const setCollection = useConfigStore((s) => s.setCollection);
  const activeMode = useConfigStore((s) => s.activeMode);
  const t = useTranslations('typing');
  const tCollections = useTranslations('typing.collection' as never) as (
    k: string,
  ) => string;

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const showCollection = MODES_WITH_COLLECTION.includes(activeMode);
  if (!showCollection) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.85rem',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--color-text-muted)',
            padding: 0,
          }}
          className="hover:text-[var(--color-text-primary)] transition-colors"
          title={t('changeCollection')}
        >
          <BookIcon size={12} className="opacity-70" />
          <AnimatePresence mode="popLayout">
            {!isMenuOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                  fontSize: '0.85rem',
                }}
              >
                {tCollections(activeCollection)}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {COLLECTIONS.map((collection) => (
                <button
                  key={collection}
                  onClick={() => {
                    setCollection(collection);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-ui)',
                    color:
                      activeCollection === collection
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                    padding: '2px 4px',
                    transition: 'color 0.1s ease',
                    fontWeight: activeCollection === collection ? 600 : 400,
                  }}
                  className="hover:text-[var(--color-text-primary)]"
                >
                  {tCollections(collection)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
