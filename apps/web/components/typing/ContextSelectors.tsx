'use client';

import { LanguagesIcon } from '@/components/ui/icons';
import { useConfigStore } from '@/stores/useConfigStore';
import type { TypingMode } from '@typewav/types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface ContextSelectorsProps {
  // Mode à utiliser pour décider de la visibilité (distinct du mode actif du
  // store quand celui-ci ne reflète pas le comportement réel de la session,
  // ex. Fantôme sans donnée personnelle qui se comporte comme Classic) : voir
  // HomeClient. Retombe sur le mode actif du store quand non fourni.
  controlsMode?: TypingMode;
}

export function ContextSelectors({ controlsMode }: ContextSelectorsProps = {}) {
  const t = useTranslations('typing');
  const textLanguage = useConfigStore((s) => s.textLanguage);
  const setTextLanguage = useConfigStore((s) => s.setTextLanguage);
  const activeMode = useConfigStore((s) => s.activeMode);

  const showLanguage = ['classic', 'sprint', 'zen', 'quote'].includes(
    controlsMode ?? activeMode,
  );

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  if (!showLanguage) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: '1rem',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.85rem',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
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
          title={t('changeLanguage')}
        >
          <LanguagesIcon size={12} className="opacity-70" />
          <AnimatePresence mode="popLayout">
            {!isLangMenuOpen && (
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
                {textLanguage === 'both'
                  ? 'french + english'
                  : textLanguage === 'fr'
                    ? 'french'
                    : 'english'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {isLangMenuOpen && (
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
              {(['fr', 'en', 'both'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setTextLanguage(lang);
                    setIsLangMenuOpen(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-ui)',
                    color:
                      textLanguage === lang
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                    padding: '2px 4px',
                    transition: 'color 0.1s ease',
                    fontWeight: textLanguage === lang ? 600 : 400,
                  }}
                  className="hover:text-[var(--color-text-primary)]"
                >
                  {lang === 'both'
                    ? 'french + english'
                    : lang === 'fr'
                      ? 'french'
                      : 'english'}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
