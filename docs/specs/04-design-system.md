# Spec 04 — Design system premium (Axe 4)

## Tokens CSS — Tailwind 4.0 CSS-first

```css
/* apps/web/styles/globals.css */
@import "tailwindcss";

@theme {
  /* Couleurs */
  --color-bg: #000000;
  --color-surface: #0A0A0A;
  --color-surface-elevated: #111111;
  --color-border: #1A1A2E;
  --color-border-subtle: #0F0F1F;
  --color-accent: #00D4AA;
  --color-accent-muted: #00A882;
  --color-text-primary: #E8E8E8;
  --color-text-muted: #888888;
  --color-text-disabled: #444444;
  --color-error: #FF4444;
  --color-success: #00D4AA;
  --color-warning: #FF8C00;

  /* Zone de frappe */
  --color-char-pending: #888888;
  --color-char-correct: #E8E8E8;
  --color-char-error-bg: #FF4444;
  --color-char-error-text: #FFFFFF;
  --color-cursor: #00D4AA;

  /* Typographie */
  --font-display: 'Cormorant Garamond', serif;
  --font-ui: 'Sora', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Rangs */
  --color-rank-novice: #888888;
  --color-rank-apprentice: #4A9EFF;
  --color-rank-operator: #00A896;
  --color-rank-architect: #00D4AA;
  --color-rank-ghost: #FFD700;
}
```

## Chargement des polices — `apps/web/app/layout.tsx`

```typescript
// next/font pour auto-optimisation (font-display: optional, subset, self-hosted)
import { Cormorant_Garamond, Sora, JetBrains_Mono } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
  display: 'optional',  // Pas de layout shift
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ui',
  display: 'optional',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'optional',
})
```

## Animations — Motion 12.x

```typescript
// IMPORTANT : import depuis motion/react, JAMAIS depuis framer-motion
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'

// Hook obligatoire dans tout composant animé
const shouldReduce = useReducedMotion()

// Durées standard
const DURATIONS = {
  keypress: shouldReduce ? 0 : 0.08,    // 80ms — micro-pulsation frappe
  correction: shouldReduce ? 0 : 0.12,  // 120ms — reprise après erreur
  transition: shouldReduce ? 0 : 0.2,   // 200ms — apparitions composants
  page: shouldReduce ? 0 : 0.3,         // 300ms — transitions de page
} as const

// Variantes réutilisables
export const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const keypressVariants = {
  idle: { scale: 1 },
  press: { scale: 1.03 },
}
```

## Zone de frappe — comportement visuel précis

```
Lettre en attente   : color = --color-char-pending (#888888)
Lettre correcte     : color = --color-char-correct (#E8E8E8)
Lettre en erreur    : background = --color-error, color = white
Curseur             : barre verticale, color = --color-accent, blink 500ms CSS
Lettre active       : underline --color-accent

Sur frappe correcte : motion scale 1.0 → 1.03 → 1.0, 80ms (vision périphérique)
Sur erreur          : aucune animation — immobilité totale
Sur correction      : opacity 0.6 → 1.0, 120ms
```

## Structure des thèmes

```typescript
// packages/types/src/theme.ts
export interface ThemeConfig {
  name: string
  author: string
  version: string
  colors: {
    background: string     // #xxxxxx
    surface: string
    border: string
    accent: string
    textPrimary: string
    textMuted: string
    error: string
    charPending: string
    charCorrect: string
  }
  fonts: {
    display: string        // nom de famille Google Fonts
    ui: string
    mono: string
  }
  soundPack: string        // packId par défaut pour ce thème
  textCollection?: string  // collectionId recommandée
  description: string
}
```

## Thèmes officiels

```
terminal    — Vert phosphore sur noir — JetBrains Mono partout — 8-bit
noir        — Blanc cassé sur noir profond — Cormorant Garamond — Jazz Piano
midnight-sun — Bleu nuit / Violet — Ambient cinématique — Poésie
arcade      — Néon rose / Cyan — Chiptune coloré — Gaming
```

## Tests requis

```
[ ] Chaque thème officiel passe le contraste WCAG AA (4.5:1)
[ ] useReducedMotion désactive toutes les animations
[ ] Les tokens CSS sont bien appliqués sur tous les thèmes
[ ] next/font charge toutes les polices sans layout shift
```
