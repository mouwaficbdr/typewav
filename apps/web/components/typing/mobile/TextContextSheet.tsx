'use client';

/**
 * TextContextSheet : la mini-feuille « texte » de l'écran de frappe mobile
 * (collection + langue). Ouverte depuis la puce secondaire de PieceDeckBar.
 * Séparée du choix de morceau : la musique d'un côté, ce qu'on tape de l'autre.
 *
 * Mêmes règles de disponibilité que CollectionSelector / ContextSelectors
 * desktop : collection cachée hors MODES_WITH_TEXT_CONFIG (et verrouillée sur
 * 'code' en mode Code, donc absente ici) ; langue visible aussi en mode Code ;
 * en mode Citation, collections non citables retirées.
 */

import { BottomSheet } from '@/components/ui/BottomSheet';
import { CheckIcon } from '@/components/ui/icons';
import { NON_CITABLE_COLLECTIONS } from '@/lib/collection-support';
import { MODES_WITH_TEXT_CONFIG } from '@/lib/typing-mode-support';
import { useConfigStore } from '@/stores/useConfigStore';
import { ALL_COLLECTIONS } from '@typewav/collections';
import type { TypingMode } from '@typewav/types';
import { useTranslations } from 'next-intl';

interface TextContextSheetProps {
  open: boolean;
  onClose: () => void;
  effectiveMode: TypingMode;
}

const LANGS = ['fr', 'en', 'both'] as const;

export function TextContextSheet({
  open,
  onClose,
  effectiveMode,
}: TextContextSheetProps) {
  const t = useTranslations('typing');
  const tCollections = useTranslations('typing.collection' as never) as (
    k: string,
  ) => string;

  const activeCollection = useConfigStore((s) => s.activeCollection);
  const setCollection = useConfigStore((s) => s.setCollection);
  const textLanguage = useConfigStore((s) => s.textLanguage);
  const setTextLanguage = useConfigStore((s) => s.setTextLanguage);

  const showCollection = MODES_WITH_TEXT_CONFIG.includes(effectiveMode);
  const showLanguage =
    MODES_WITH_TEXT_CONFIG.includes(effectiveMode) || effectiveMode === 'code';

  const collections =
    effectiveMode === 'quote'
      ? ALL_COLLECTIONS.filter((c) => !NON_CITABLE_COLLECTIONS.includes(c))
      : ALL_COLLECTIONS;

  const langLabel = (lang: 'fr' | 'en' | 'both') =>
    lang === 'both' ? t('langBoth') : lang === 'fr' ? t('langFr') : t('langEn');

  const rowStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    minHeight: 48,
    padding: '10px 12px',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    background: active
      ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)'
      : 'transparent',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.92rem',
    fontWeight: active ? 600 : 400,
    textAlign: 'left',
    cursor: 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  });

  const check = (active: boolean) => (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: 16,
        display: 'flex',
        color: 'var(--color-accent)',
      }}
    >
      {active && <CheckIcon size={16} />}
    </span>
  );

  const sectionLabelStyle: React.CSSProperties = {
    margin: '4px 0 6px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t('textContextTitle')}>
      {showCollection && (
        <>
          <p style={sectionLabelStyle}>{t('sheetCollectionLabel')}</p>
          <div
            role="radiogroup"
            aria-label={t('changeCollection')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              marginBottom: 20,
            }}
          >
            {collections.map((collection) => {
              const active = activeCollection === collection;
              return (
                <button
                  key={collection}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCollection(collection)}
                  style={rowStyle(active)}
                >
                  <span>{tCollections(collection)}</span>
                  {check(active)}
                </button>
              );
            })}
          </div>
        </>
      )}

      {showLanguage && (
        <>
          <p style={sectionLabelStyle}>{t('sheetLanguageLabel')}</p>
          <div
            role="radiogroup"
            aria-label={t('changeLanguage')}
            style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {LANGS.map((lang) => {
              const active = textLanguage === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTextLanguage(lang)}
                  style={rowStyle(active)}
                >
                  <span>{langLabel(lang)}</span>
                  {check(active)}
                </button>
              );
            })}
          </div>
        </>
      )}
    </BottomSheet>
  );
}
