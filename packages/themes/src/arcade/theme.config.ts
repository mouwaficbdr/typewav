import type { ThemeConfig } from '@typewav/types'

export const arcadeTheme: ThemeConfig = {
  id: 'arcade',
  name: 'Arcade',
  description: 'Pixel pop — énergie rétro-gaming et couleurs saturées.',
  isPremium: false,
  colors: {
    bg: '#0A0014',
    surface: '#120020',
    border: '#2D0060',
    accent: '#FF00FF',
    textPrimary: '#F0E0FF',
    textMuted: '#7040A0',
    error: '#FF3030',
    charPending: '#7040A0',
    charCorrect: '#FF00FF',
    charError: '#FF3030',
    charCurrent: '#F0E0FF',
    cursor: '#FF00FF',
  },
  fonts: {
    display: 'Cormorant Garamond',
    ui: 'Sora',
    mono: 'JetBrains Mono',
  },
  chordProgressionId: 'arcade',
  defaultSoundPackId: 'chiptune',
}
