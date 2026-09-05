'use client';

/**
 * ThemeQuickSwitcher : bascule rapide de thème façon MonkeyType (ticket #64).
 *
 * Autonome : ni props, ni état à porter par l'appelant (contrairement à
 * PersonalTextsPanel). Déclencheur discret (icône + nom du thème actif) qui
 * ouvre un panneau : recherche en haut, liste des thèmes visibles en dessous.
 *
 * Aperçu live : survoler OU donner le focus clavier à une ligne applique
 * immédiatement ses couleurs à toute l'application via `applyThemeColors`
 * (pas d'écriture dans le store, donc rien n'est persisté), et les restaure
 * au départ du survol/focus. Cliquer (ou Entrée, geste natif d'un <button>)
 * valide via `setTheme`. Fermer sans clic (Échap ou clic extérieur) restaure
 * le thème réellement actif : le mécanisme est le même que le survol, appliqué
 * une dernière fois à la fermeture pour couvrir le cas où le pointeur est
 * resté sur une ligne au moment de fermer.
 */

import { getUserProfile } from '@/lib/db';
import { useThemeStore } from '@/stores/useThemeStore';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { APP_THEMES, BASE_UNLOCKED_THEME_IDS } from '@/lib/theme/defaultThemes';
import { applyThemeColors } from '@/lib/theme/ThemeProvider';
import { CheckIcon, CloseIcon, PaletteIcon, SearchIcon } from './icons';

export function ThemeQuickSwitcher() {
  const t = useTranslations('themeSwitcher');
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [unlockedThemes, setUnlockedThemes] =
    useState<readonly string[]>(BASE_UNLOCKED_THEME_IDS);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUserProfile()
      .then((profile) => setUnlockedThemes(profile.unlockedThemes))
      .catch(() => undefined);
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

  useEffect(() => {
    if (!isOpen) return;
    searchRef.current?.focus();

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
  }

  /** Ferme sans persister : restaure le thème réellement actif. */
  function dismiss() {
    applyThemeColors(activeTheme);
    setIsOpen(false);
  }

  function commit(id: string) {
    const theme = APP_THEMES[id];
    if (theme) applyThemeColors(theme);
    setTheme(id);
    setIsOpen(false);
  }

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

      {isOpen && (
        <div
          onClick={dismiss}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'color-mix(in srgb, black 55%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('title')}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              overflow: 'hidden',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SearchIcon size={14} className="text-text-muted shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text-primary)',
                }}
              />
              <button
                type="button"
                onClick={dismiss}
                aria-label={t('close')}
                title={t('close')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  padding: 2,
                  flexShrink: 0,
                }}
                className="hover:text-text-primary transition-colors"
              >
                <CloseIcon size={14} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                overflowY: 'auto',
              }}
            >
              {filteredThemes.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    padding: '8px 4px',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {t('noResults', { query })}
                </p>
              ) : (
                filteredThemes.map((theme) => {
                  const isActive = theme.id === themeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      aria-pressed={isActive}
                      onMouseEnter={() => applyThemeColors(theme)}
                      onMouseLeave={() => applyThemeColors(activeTheme)}
                      onFocus={() => applyThemeColors(theme)}
                      onBlur={() => applyThemeColors(activeTheme)}
                      onClick={() => commit(theme.id)}
                      className="focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--color-accent)]"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isActive ? theme.colors.accent : 'transparent'}`,
                        background: theme.colors.bg,
                        color: theme.colors.textPrimary,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{theme.name.toLowerCase()}</span>
                      <span className="flex items-center gap-1.5 shrink-0" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isActive && (
                          <CheckIcon size={12} />
                        )}
                        <span
                          aria-hidden="true"
                          style={{ display: 'flex', gap: 4 }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 9999,
                              background: theme.colors.surface,
                            }}
                          />
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 9999,
                              background: theme.colors.accent,
                            }}
                          />
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
