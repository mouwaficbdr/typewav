import type { ThemeConfig } from '@typewav/types'

export const noirTheme: ThemeConfig = {
  id: 'noir',
  name: 'Noir',
  description: 'Jazz et ombre — atmosphère nocturne et cinématique.',
  isPremium: false,
  colors: {
    bg: '#0D0D0D',
    surface: '#161616',
    border: '#2A2020',
    accent: '#C8963E',
    textPrimary: '#D4C9B8',
    textMuted: '#6B6358',
    error: '#C0392B',
    charPending: '#6B6358',
    charCorrect: '#C8963E',
    charError: '#C0392B',
    charCurrent: '#D4C9B8',
    cursor: '#C8963E',
  },
  fonts: {
    display: 'Cormorant Garamond',
    ui: 'Sora',
    mono: 'JetBrains Mono',
  },
  chordProgressionId: 'noir',
  defaultSoundPackId: 'piano',
}
