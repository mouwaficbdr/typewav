import { arcadeTheme, midnightSunTheme, noirTheme } from '@typewav/themes';
import type { ThemeConfig } from '@typewav/types';

/**
 * Thèmes rendus par l'application (sélecteur de /parametres, ThemeProvider,
 * ThemeScript).
 *
 * Les 4 premiers sont les thèmes de base, débloqués d'office
 * (`BASE_UNLOCKED_THEME_IDS`). `noir` / `midnight-sun` / `arcade` viennent de
 * `@typewav/themes` (objets `ThemeConfig` complets, déjà AA) et sont
 * débloqués par les jalons `MILESTONES` (`first_session`, `sessions_50`,
 * `wpm_70`).
 */
export const APP_THEMES: Record<string, ThemeConfig> = {
  terminal: {
    id: 'terminal',
    name: 'Dark Terminal',
    description: 'Le terminal original.',
    isPremium: false,
    colors: {
      bg: '#000000',
      surface: '#0A0A0A',
      border: '#1A1A2E',
      accent: '#00D4AA',
      textPrimary: '#E8E8E8',
      textMuted: '#888888',
      error: '#FF4444',
      charPending: '#888888',
      charCorrect: '#00D4AA',
      charError: '#FF4444',
      charCurrent: '#E8E8E8',
      cursor: '#00D4AA',
    },
    fonts: {
      display: 'Cormorant Garamond',
      ui: 'Sora',
      mono: 'JetBrains Mono',
    },
    chordProgressionId: 'terminal',
    defaultSoundPackId: 'piano',
  },
  'deep-burgundy': {
    id: 'deep-burgundy',
    name: 'Deep Burgundy',
    description: 'Rouge bordeaux et sable doré.',
    isPremium: false,
    colors: {
      bg: '#5B0E14',
      surface: '#4A0B10',
      border: '#3A080C',
      accent: '#F1E194',
      textPrimary: '#F1E194',
      textMuted: '#A89B66',
      error: '#FF6B6B',
      charPending: '#A89B66',
      charCorrect: '#F1E194',
      charError: '#FF6B6B',
      charCurrent: '#FFFFFF',
      cursor: '#F1E194',
    },
    fonts: {
      display: 'Cormorant Garamond',
      ui: 'Sora',
      mono: 'JetBrains Mono',
    },
    chordProgressionId: 'terminal',
    defaultSoundPackId: 'piano',
  },
  'cyprus-sand': {
    id: 'cyprus-sand',
    name: 'Cyprus Sand',
    description: 'Cyprès profond et sable.',
    isPremium: false,
    colors: {
      bg: '#004643',
      surface: '#003A38',
      border: '#002E2D',
      accent: '#F0EDE5',
      textPrimary: '#F0EDE5',
      // textMuted / error remontés à WCAG 2.2 AA (>= 4.5:1 sur bg et surface).
      // Voir apps/web/lib/__tests__/theme-contrast.test.ts.
      textMuted: '#9EB0AB',
      error: '#FF8989',
      charPending: '#9EB0AB',
      charCorrect: '#F0EDE5',
      charError: '#FF8989',
      charCurrent: '#FFFFFF',
      cursor: '#F0EDE5',
    },
    fonts: {
      display: 'Cormorant Garamond',
      ui: 'Sora',
      mono: 'JetBrains Mono',
    },
    chordProgressionId: 'terminal',
    defaultSoundPackId: 'piano',
  },
  'night-imperial': {
    id: 'night-imperial',
    name: 'Night Imperial',
    description: 'Nuit et rouge impérial.',
    isPremium: false,
    colors: {
      bg: '#000F08',
      surface: '#001A0E',
      border: '#002514',
      accent: '#FB3640',
      textPrimary: '#E8E8E8',
      textMuted: '#888888',
      error: '#FF6B6B',
      charPending: '#888888',
      charCorrect: '#FB3640',
      charError: '#FF6B6B',
      charCurrent: '#FFFFFF',
      cursor: '#FB3640',
    },
    fonts: {
      display: 'Cormorant Garamond',
      ui: 'Sora',
      mono: 'JetBrains Mono',
    },
    chordProgressionId: 'terminal',
    defaultSoundPackId: 'piano',
  },
  // Thèmes de jalon : définis dans `@typewav/themes`, débloqués via MILESTONES.
  noir: noirTheme,
  'midnight-sun': midnightSunTheme,
  arcade: arcadeTheme,
};

/**
 * Thèmes débloqués d'office. Seule vérité du défaut, importée par
 * `db.ts` (`DEFAULT_PROFILE.unlockedThemes`) et par le sélecteur de thème.
 * Tout ce qui n'est pas là est derrière un jalon.
 */
export const BASE_UNLOCKED_THEME_IDS = [
  'terminal',
  'deep-burgundy',
  'cyprus-sand',
  'night-imperial',
] as const;
