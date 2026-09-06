'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import type { ThemeConfig } from '@typewav/types';
import { useEffect } from 'react';
import { APP_THEMES } from './defaultThemes';

/**
 * Applique les couleurs d'un thème aux variables CSS globales.
 *
 * Exportée (ticket #64) pour être rappelée directement par
 * `ThemeQuickSwitcher` au survol/focus d'une ligne (aperçu live sans
 * persister dans le store), en plus de l'effet ci-dessous qui l'appelle au
 * changement réel de thème.
 */
export function applyThemeColors(theme: ThemeConfig) {
  const root = document.documentElement;

  root.style.setProperty('--color-bg', theme.colors.bg);
  root.style.setProperty('--color-surface', theme.colors.surface);
  root.style.setProperty('--color-border', theme.colors.border);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--color-text-muted', theme.colors.textMuted);
  root.style.setProperty('--color-error', theme.colors.error);
  root.style.setProperty('--color-char-pending', theme.colors.charPending);
  root.style.setProperty('--color-char-correct', theme.colors.charCorrect);
  root.style.setProperty('--color-char-error', theme.colors.charError);
  root.style.setProperty('--color-char-current', theme.colors.charCurrent);
  root.style.setProperty('--color-cursor', theme.colors.cursor);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    applyThemeColors(APP_THEMES[themeId] ?? APP_THEMES['cyprus-sand']!);
  }, [themeId]);

  return <>{children}</>;
}
