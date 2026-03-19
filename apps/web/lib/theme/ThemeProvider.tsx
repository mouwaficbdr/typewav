'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useEffect } from 'react';
import { APP_THEMES } from './defaultThemes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    const theme = APP_THEMES[themeId] || APP_THEMES['terminal'];
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
  }, [themeId]);

  return <>{children}</>;
}
