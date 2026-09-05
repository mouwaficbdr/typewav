import type { ThemeConfig } from '@typewav/types';

export const terminalTheme: ThemeConfig = {
  id: 'terminal',
  name: 'Terminal',
  description: 'Dark terminal luxury, le thème par défaut.',
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
};
