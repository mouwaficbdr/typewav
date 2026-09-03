import type { ThemeConfig } from '@typewav/types'

export const noirTheme: ThemeConfig = {
  id: 'noir',
  name: 'Noir',
  description: 'Jazz et ombre : atmosphère nocturne et cinématique.',
  isPremium: false,
  colors: {
    bg: '#0D0D0D',
    surface: '#161616',
    border: '#2A2020',
    accent: '#C8963E',
    textPrimary: '#D4C9B8',
    // textMuted / error remontés à WCAG 2.2 AA (>= 4.5:1 sur bg et surface).
    // Voir apps/web/lib/__tests__/theme-contrast.test.ts.
    textMuted: '#8B8172',
    error: '#EB4635',
    charPending: '#8B8172',
    charCorrect: '#C8963E',
    charError: '#EB4635',
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
