'use client';

import { DataManagement } from '@/components/settings/DataManagement';
import {
  KEYBOARD_LAYOUTS,
  useKeyboardLayoutPreference,
} from '@/hooks/useKeyboardLayoutPreference';
import { routing } from '@/i18n/routing';
import { isNonDesktopDevice } from '@/lib/device';
import { resetLearningFingerIntroSeen } from '@/lib/onboarding';
import { APP_THEMES } from '@/lib/theme/defaultThemes';
import { useConfigStore } from '@/stores/useConfigStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { CheckCircle2, Keyboard, Languages, Palette } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const LANGUAGE_LABEL_KEYS: Record<string, string> = {
  fr: 'languageFr',
  en: 'languageEn',
};

export function ParametresClient() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { layout, setLayout } = useKeyboardLayoutPreference();
  const { setMode } = useConfigStore();
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  // Sort de la ConfigBar (ticket #62, obsession-architect) : le mode
  // Apprentissage n'est utile qu'une fois par utilisateur (ou après un
  // changement de disposition), pas assez pour mériter un onglet permanent
  // à côté des modes récurrents. Ce lien réinitialise explicitement l'écran
  // de positionnement des doigts avant d'y naviguer : contrairement au
  // premier passage automatique (jamais revu une fois vu), ici l'intention
  // explicite de le revoir doit toujours le montrer.
  function handleReviewFingerPositioning() {
    void resetLearningFingerIntroSeen();
    setMode('learning');
    router.push(`/${locale}`);
  }

  // Le mode Apprentissage est desktop-only (#98). Sur téléphone / tablette,
  // l'entrée « revoir le positionnement des doigts » n'a nulle part où mener :
  // on la masque. Lu dans un effet (matchMedia indisponible au rendu serveur),
  // setState différé par microtâche (react-hooks/set-state-in-effect).
  const [nonDesktop, setNonDesktop] = useState(false);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setNonDesktop(isNonDesktopDevice());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tous les thèmes d'`APP_THEMES` sont débloqués d'office : le sélecteur les
  // propose tous, sans filtrage par profil.
  const themes = Object.values(APP_THEMES);

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
                    className="relative group flex min-h-[46px] items-center justify-between gap-2 px-3 py-2 rounded font-mono text-xs transition-transform hover:scale-[1.02] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--color-accent)]"
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

        {/* Section : langue & clavier */}
        <section className="flex flex-col gap-10">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-mono mb-4 border-b border-[var(--color-border)] pb-2">
            <Languages className="w-4 h-4" aria-hidden="true" />
            <h2 className="text-lg">{t('localeGroup')}</h2>
          </div>

          {/* Langue d'affichage : chaque option navigue vers la même page
              sous l'autre locale (next-intl mémorise le choix via son
              cookie NEXT_LOCALE, posé automatiquement par le middleware dès
              qu'une route préfixée est visitée). Pas de préférence séparée
              à stocker : le routing en est déjà la source de vérité. */}
          <div className="flex flex-col gap-4">
            <h3 className="font-mono text-sm text-[var(--color-text-primary)]">
              {t('languageTitle')}
            </h3>
            <div className="flex gap-3">
              {routing.locales.map((loc) => {
                const isActive = loc === locale;
                const href = pathname.replace(`/${locale}`, `/${loc}`);
                const label = t(LANGUAGE_LABEL_KEYS[loc] ?? loc);
                return (
                  <Link
                    key={loc}
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={t('selectLanguage', { name: label })}
                    className="relative flex items-center gap-2 px-3 py-2 rounded font-mono text-xs transition-transform hover:scale-[1.02] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--color-accent)]"
                    style={{
                      color: isActive
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                      border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: isActive
                        ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                        : 'transparent',
                    }}
                  >
                    {isActive && (
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Disposition du clavier physique : préférence IndexedDB, pas de
              consommateur pour l'instant (voir ticket #62, clavier visuel du
              mode Apprentissage). */}
          <div className="flex flex-col gap-4">
            <h3 className="font-mono text-sm text-[var(--color-text-primary)]">
              {t('keyboardLayoutTitle')}
            </h3>
            <div className="flex gap-3">
              {KEYBOARD_LAYOUTS.map((kl) => {
                const isActive = kl === layout;
                const label = t(kl === 'qwerty' ? 'layoutQwerty' : 'layoutAzerty');
                return (
                  <button
                    key={kl}
                    type="button"
                    onClick={() => setLayout(kl)}
                    aria-pressed={isActive}
                    aria-label={t('selectLayout', { name: label })}
                    className="relative flex items-center gap-2 px-3 py-2 rounded font-mono text-xs transition-transform hover:scale-[1.02] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--color-accent)]"
                    style={{
                      color: isActive
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                      border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: isActive
                        ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                        : 'transparent',
                    }}
                  >
                    {isActive && (
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] font-mono">
              {t('keyboardLayoutHint')}
            </p>
            {!nonDesktop && (
              <button
                type="button"
                onClick={handleReviewFingerPositioning}
                className="self-start flex items-center gap-2 px-3 py-2 rounded font-mono text-xs border border-[var(--color-border)] text-[var(--color-text-muted)] transition-transform hover:scale-[1.02] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--color-accent)]"
              >
                <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
                {t('reviewFingerPositioning')}
              </button>
            )}
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
