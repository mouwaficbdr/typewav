'use client';

import { getUserProfile } from '@/lib/db';
import { APP_THEMES, BASE_UNLOCKED_THEME_IDS } from '@/lib/theme/defaultThemes';
import { useThemeStore } from '@/stores/useThemeStore';
import { CheckCircle2, Palette } from 'lucide-react';
import { motion } from 'motion/react';
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

  // Les thèmes de base sont toujours proposés, quel que soit le profil stocké
  // (un profil d'avant WS-5 #6 peut n'avoir que `['terminal']`).
  const visibleIds = new Set<string>([
    ...BASE_UNLOCKED_THEME_IDS,
    ...unlockedThemes,
  ]);
  const themes = Object.values(APP_THEMES).filter((theme) =>
    visibleIds.has(theme.id),
  );

  return (
    <main className="content-typing flex flex-col gap-12 py-12 max-w-4xl mx-auto w-full px-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
          {t('title')}
        </h1>
        <p className="text-lg text-[var(--color-text-muted)]">
          {t('description')}
        </p>
      </div>

      {/* Themes Section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4">
          <Palette className="w-6 h-6 text-[var(--color-accent)]" />
          <h2 className="font-ui text-2xl font-semibold text-[var(--color-text-primary)]">
            {t('themeTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {themes.map((theme) => {
            const isActive = theme.id === themeId;
            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`
                  group relative flex flex-col w-full text-left overflow-hidden
                  rounded-xl border-2 transition-all duration-300 ease-out
                  hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]
                  ${isActive ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'}
                `}
                style={{ backgroundColor: 'var(--color-surface)' }}
                aria-label={t('selectTheme', { name: theme.name })}
                aria-pressed={isActive}
              >
                {/* Visual Preview Area */}
                <div
                  className="w-full h-24 p-4 flex flex-col justify-between"
                  style={{ backgroundColor: theme.colors.bg }}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className="text-sm font-bold font-mono px-2 py-1 rounded"
                      style={{
                        color: theme.colors.textPrimary,
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      Typewav
                    </span>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <CheckCircle2
                          className="w-5 h-5 drop-shadow-md"
                          style={{ color: theme.colors.accent }}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Fake Typing Line */}
                  <div className="flex gap-1 font-mono text-sm opacity-90 mt-auto">
                    <span style={{ color: theme.colors.charCorrect }}>typ</span>
                    <span
                      style={{
                        color: theme.colors.charCurrent,
                        borderBottom: `2px solid ${theme.colors.cursor}`,
                      }}
                    >
                      i
                    </span>
                    <span style={{ color: theme.colors.charPending }}>
                      ng...
                    </span>
                  </div>
                </div>

                {/* Theme Info Area */}
                <div className="flex flex-col gap-3 p-4 bg-[var(--color-surface)] z-10">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-ui text-lg font-bold transition-colors ${isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]'}`}
                    >
                      {theme.name}
                    </h3>
                  </div>

                  {/* Mini Palette Dots */}
                  <div className="flex items-center gap-1.5 opacity-90">
                    {[
                      theme.colors.bg,
                      theme.colors.surface,
                      theme.colors.textMuted,
                      theme.colors.textPrimary,
                      theme.colors.accent,
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full shadow-sm border border-black/10"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeThemeBg"
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(to top, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent)',
                      }}
                      transition={{
                        type: 'spring',
                        bounce: 0.15,
                        duration: 0.5,
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
