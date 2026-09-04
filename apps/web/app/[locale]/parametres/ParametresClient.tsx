'use client';

import { DataManagement } from '@/components/settings/DataManagement';
import { getUserProfile } from '@/lib/db';
import { APP_THEMES, BASE_UNLOCKED_THEME_IDS } from '@/lib/theme/defaultThemes';
import { useThemeStore } from '@/stores/useThemeStore';
import { CheckCircle2, Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function ParametresClient() {
  const t = useTranslations('settings');
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  // Thèmes débloqués : `UserProfile.unlockedThemes` (IndexedDB), alimenté par
  // les jalons. Avant chargement, on montre les thèmes de base pour éviter un
  // écran vide (ils n'apparaissent jamais après coup, ils disparaissent
  // seulement si l'utilisateur n'en a débloqué aucun de plus).
  const [unlockedThemes, setUnlockedThemes] =
    useState<readonly string[]>(BASE_UNLOCKED_THEME_IDS);

  useEffect(() => {
    getUserProfile()
      .then((profile) => setUnlockedThemes(profile.unlockedThemes))
      .catch(() => undefined);
  }, []);

  // Les thèmes de base sont toujours proposés, quel que soit le profil stocké.
  const visibleIds = new Set<string>([
    ...BASE_UNLOCKED_THEME_IDS,
    ...unlockedThemes,
  ]);
  const themes = Object.values(APP_THEMES).filter((theme) =>
    visibleIds.has(theme.id),
  );

  return (
    <main className="min-h-screen text-[var(--color-text-primary)] pb-32">
      {/* Titre de page : rendu dense (mono, minuscule) façon fil d'ariane,
          mais c'est un vrai <h1>, pas un landmark de navigation. */}
      <div className="w-full flex justify-between items-center px-6 py-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)]">
          <Palette className="w-4 h-4" aria-hidden="true" />
          <span aria-hidden="true">/</span>
          <h1 className="font-mono text-xs text-[var(--color-text-primary)]">
            {t('title').toLowerCase()}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 flex flex-col gap-16 mt-8">
        {/* Section : apparence */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-mono mb-4 border-b border-[var(--color-border)] pb-2">
            <Palette className="w-4 h-4" aria-hidden="true" />
            <h2 className="text-lg">{t('appearance')}</h2>
          </div>

          {/* Sélecteur de thème */}
          <div className="flex flex-col gap-4">
            <h3 className="font-mono text-sm text-[var(--color-text-primary)]">
              {t('themeTitle')}
            </h3>

            {/* Indicateur de focus clavier : `outline` et non `ring`, parce que
                le `box-shadow` inline de l'état actif écrase toujours la classe
                `ring` (spécificité du style inline). `outline` est une propriété
                distincte, elle coexiste avec le `box-shadow`. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-2">
              {themes.map((theme) => {
                const isActive = theme.id === themeId;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setTheme(theme.id)}
                    aria-pressed={isActive}
                    aria-label={t('selectTheme', { name: theme.name })}
                    className="relative group flex items-center justify-between gap-2 px-3 py-2 rounded font-mono text-xs transition-transform hover:scale-[1.02] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--color-accent)]"
                    style={{
                      backgroundColor: theme.colors.bg,
                      color: theme.colors.textPrimary,
                      border: `1px solid ${isActive ? theme.colors.accent : 'transparent'}`,
                      boxShadow: isActive
                        ? `0 0 0 1px ${theme.colors.accent}`
                        : 'none',
                    }}
                  >
                    <span>{theme.name.toLowerCase()}</span>

                    <span className="flex items-center gap-1.5 shrink-0">
                      {/* Signal d'état actif porté par une forme, pas seulement
                          par la couleur de bordure (WCAG 1.4.1). */}
                      {isActive && (
                        <CheckCircle2
                          className="w-3.5 h-3.5"
                          style={{ color: theme.colors.textPrimary }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="flex gap-1" aria-hidden="true">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.colors.surface }}
                        />
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section : données */}
        <section className="flex flex-col gap-6">
          <DataManagement />
        </section>
      </div>
    </main>
  );
}
