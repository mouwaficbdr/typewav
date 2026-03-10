export interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  accent: string;
  textPrimary: string;
  textMuted: string;
  error: string;
  // Couleurs de caractères pour la zone de frappe
  charPending: string;
  charCorrect: string;
  charError: string;
  charCurrent: string;
  cursor: string;
}

export interface ThemeFonts {
  display: string;
  ui: string;
  mono: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  colors: ThemeColors;
  fonts: ThemeFonts;
  /** ID de la progression d'accords associée (voir chord-progressions) */
  chordProgressionId: string;
  /** Pack sonore par défaut pour ce thème */
  defaultSoundPackId: string;
}
