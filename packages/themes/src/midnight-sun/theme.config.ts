import type { ThemeConfig } from '@typewav/types'

export const midnightSunTheme: ThemeConfig = {
  id: 'midnight-sun',
  name: 'Soleil de minuit',
  description: 'Ambiance nordique — lumière froide et tons bleutés.',
  isPremium: false,
  colors: {
    bg: '#080E1A',
    surface: '#0E1829',
    border: '#1C2C50',
    accent: '#5B9BD5',
    textPrimary: '#C8D8F0',
    textMuted: '#5A7399',
    error: '#E05A6F',
    charPending: '#5A7399',
    charCorrect: '#5B9BD5',
    charError: '#E05A6F',
    charCurrent: '#C8D8F0',
    cursor: '#5B9BD5',
  },
  fonts: {
    display: 'Cormorant Garamond',
    ui: 'Sora',
    mono: 'JetBrains Mono',
  },
  chordProgressionId: 'midnight-sun',
  defaultSoundPackId: 'marimba',
}
