'use client';

/**
 * ThemeQuickSwitcher : bascule rapide de thème, calquée sur le sélecteur de
 * thème du command line de MonkeyType (ticket #64, corrections post-QA).
 *
 * Rendue via un portail dans document.body : ce composant vit dans le pied
 * de page de l'écran de frappe, dont un ancêtre (`fadeOnStart` sur le
 * `<footer>`) porte un `transform` permanent (même `translateY(0)`). Un
 * `transform` sur un ancêtre, quelle que soit sa valeur, crée un nouveau bloc
 * conteneur pour tout descendant en `position: fixed` : sans portail, le
 * panneau se positionnait donc par rapport au footer (minuscule) plutôt que
 * par rapport à la fenêtre, d'où un panneau mal placé et un fond assombri
 * cantonné au footer. Le portail élimine le problème à la racine.
 *
 * Fidélité MonkeyType : panneau ancré en haut de l'écran (pas centré), sans
 * assombrissement du reste de la page, anneau `box-shadow` plutôt qu'une
 * bordure dure, police mono partout, aucune ligne peinte dans ses propres
 * couleurs (seule la ligne en surbrillance clavier/souris passe en couleurs
 * inversées), navigation clavier haut/bas avec bouclage, aperçu appliqué
 * après un court debounce (250ms, comme `ThemeController.preview` chez eux)
 * pour ne pas empiler des recalculs de style à chaque frame pendant un
 * balayage rapide de la souris.
 */

import { getUserProfile } from '@/lib/db';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useThemeStore } from '@/stores/useThemeStore';
import type { ThemeConfig } from '@typewav/types';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { APP_THEMES, BASE_UNLOCKED_THEME_IDS } from '@/lib/theme/defaultThemes';
import { applyThemeColors } from '@/lib/theme/ThemeProvider';
import { CheckIcon, PaletteIcon, SearchIcon } from './icons';

const PREVIEW_DEBOUNCE_MS = 250;

function ThemeDot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: '100%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

export function ThemeQuickSwitcher() {
  const t = useTranslations('themeSwitcher');
  const baseId = useId();
  const isMobile = useIsMobile();
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [unlockedThemes, setUnlockedThemes] =
    useState<readonly string[]>(BASE_UNLOCKED_THEME_IDS);
  const searchRef = useRef<HTMLInputElement>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getUserProfile()
      .then((profile) => setUnlockedThemes(profile.unlockedThemes))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  const activeTheme = APP_THEMES[themeId] ?? APP_THEMES['terminal']!;

  const themes = useMemo(() => {
    const visibleIds = new Set<string>([
      ...BASE_UNLOCKED_THEME_IDS,
      ...unlockedThemes,
    ]);
    return Object.values(APP_THEMES).filter((theme) =>
      visibleIds.has(theme.id),
    );
  }, [unlockedThemes]);

  const filteredThemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return themes;
    return themes.filter((theme) => theme.name.toLowerCase().includes(q));
  }, [themes, query]);

  const rowId = (id: string) => `${baseId}-option-${id}`;

  function schedulePreview(theme: ThemeConfig) {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      applyThemeColors(theme);
      previewTimerRef.current = null;
    }, PREVIEW_DEBOUNCE_MS);
  }

  function cancelPendingPreview() {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }

  function setHighlighted(index: number) {
    setHighlightedIndex(index);
    const theme = filteredThemes[index];
    if (theme) schedulePreview(theme);
  }

  // Pré-sélectionne le thème actif à l'ouverture (comme leur `firstActive`),
  // ou le premier résultat dès qu'une recherche est en cours ; défile la
  // ligne en vue, sans animation (comme `scrollIntoView({behavior:'auto'})`).
  useEffect(() => {
    if (!isOpen) return;
    if (filteredThemes.length === 0) return;
    const idx =
      query.trim() === ''
        ? Math.max(
            filteredThemes.findIndex((theme) => theme.id === themeId),
            0,
          )
        : 0;
    setHighlighted(idx);
    document
      .getElementById(rowId(filteredThemes[idx]!.id))
      ?.scrollIntoView?.({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, query, themes]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function open() {
    setQuery('');
    setIsOpen(true);
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  /** Ferme sans persister : restaure le thème réellement actif. */
  function dismiss() {
    cancelPendingPreview();
    applyThemeColors(activeTheme);
    setIsOpen(false);
  }

  function commit(id: string) {
    cancelPendingPreview();
    const theme = APP_THEMES[id];
    if (theme) applyThemeColors(theme);
    setTheme(id);
    setIsOpen(false);
  }

  function move(delta: number) {
    if (filteredThemes.length === 0) return;
    const next =
      (highlightedIndex + delta + filteredThemes.length) %
      filteredThemes.length;
    setHighlighted(next);
    document
      .getElementById(rowId(filteredThemes[next]!.id))
      ?.scrollIntoView?.({ block: 'nearest' });
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const theme = filteredThemes[highlightedIndex];
      if (theme) commit(theme.id);
    }
  }

  const listId = `${baseId}-listbox`;
  const highlightedTheme = filteredThemes[highlightedIndex];

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="hover:text-text-primary cursor-pointer transition-colors"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          font: 'inherit',
          padding: 0,
        }}
      >
        <PaletteIcon size={12} />
        {activeTheme.name.toLowerCase()}
      </button>

      {isOpen &&
        createPortal(
          <div
            onClick={dismiss}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              // Mobile : centré verticalement et resserré (demande Mouwafic).
              // Desktop : ancré en haut, fidélité MonkeyType.
              alignItems: isMobile ? 'center' : 'flex-start',
              justifyContent: 'center',
              padding: isMobile ? '1.5rem 1rem' : '6rem 2rem',
              zIndex: 100,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t('title')}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: isMobile ? 340 : 600,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--color-surface)',
                boxShadow: '0 0 0 3px var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
                <SearchIcon size={14} className="text-text-muted shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-autocomplete="list"
                  {...(highlightedTheme !== undefined
                    ? { 'aria-activedescendant': rowId(highlightedTheme.id) }
                    : {})}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={t('searchPlaceholder')}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: isMobile ? '12px 0' : '16px 0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              <div
                id={listId}
                role="listbox"
                aria-label={t('title')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  maxHeight: isMobile ? '50svh' : 'calc(100vh - 12rem - 3rem)',
                }}
              >
                {filteredThemes.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      padding: '8px 16px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {t('noResults', { query })}
                  </p>
                ) : (
                  filteredThemes.map((theme, index) => {
                    const isHighlighted = index === highlightedIndex;
                    const isCurrentTheme = theme.id === themeId;
                    return (
                      <div
                        key={theme.id}
                        id={rowId(theme.id)}
                        role="option"
                        aria-selected={isHighlighted}
                        onMouseEnter={() => setHighlighted(index)}
                        onClick={() => commit(theme.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: isMobile ? '7px 14px' : '8px 16px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: isMobile ? '0.72rem' : '0.75rem',
                          cursor: 'pointer',
                          background: isHighlighted
                            ? 'var(--color-text-primary)'
                            : 'transparent',
                          color: isHighlighted
                            ? 'var(--color-bg)'
                            : 'var(--color-text-muted)',
                        }}
                      >
                        <span
                          style={{
                            width: 14,
                            display: 'flex',
                            flexShrink: 0,
                          }}
                        >
                          {isCurrentTheme && <CheckIcon size={12} />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          {theme.name.toLowerCase()}
                        </span>
                        <span
                          aria-hidden="true"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0,
                            padding: '2px 8px',
                            borderRadius: 9999,
                            background: theme.colors.bg,
                          }}
                        >
                          <ThemeDot color={theme.colors.accent} />
                          <ThemeDot color={theme.colors.textMuted} />
                          <ThemeDot color={theme.colors.textPrimary} />
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
