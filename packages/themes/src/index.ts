export { terminalTheme } from './terminal/theme.config'
export { noirTheme } from './noir/theme.config'
export { midnightSunTheme } from './midnight-sun/theme.config'
export { arcadeTheme } from './arcade/theme.config'

export const ALL_THEMES = ['terminal', 'noir', 'midnight-sun', 'arcade'] as const
export type ThemeId = (typeof ALL_THEMES)[number]
