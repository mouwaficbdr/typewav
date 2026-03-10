# Stratégie de tests TypeWav

> Vitest 4.0.18 + @vitest/browser-playwright 4.0.18

## Philosophie

**TDD strict.** Red → Green → Refactor. Le test précède l'implémentation.  
**Tests comme documentation.** Un test qui passe explique exactement ce que le code fait.  
**Pyramide de tests.** Beaucoup d'unitaires, moins d'intégration, peu d'E2E.

---

## Configuration Vitest

```typescript
// vitest.config.ts (à la racine du monorepo)
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',           // Défaut pour packages/
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      }
    },
    projects: [
      {
        // Tests unitaires — packages/
        extends: true,
        test: {
          name: 'unit',
          include: ['packages/**/src/__tests__/**/*.test.ts'],
          environment: 'node',
        }
      },
      {
        // Tests composants — apps/web (Browser Mode Vitest 4 stable)
        extends: true,
        test: {
          name: 'browser',
          include: ['apps/web/**/__tests__/**/*.test.tsx'],
          browser: {
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            headless: true,
          }
        }
      }
    ]
  }
})
```

---

## Types de tests

### 1. Tests unitaires — `packages/`

Pour toute logique pure (moteur audio, calculs de stats, utilitaires).

```typescript
// packages/audio-engine/src/__tests__/pentatonic.test.ts
import { describe, it, expect } from 'vitest'
import { getPentatonicNote, buildChordProgression } from '../pentatonic'

describe('getPentatonicNote', () => {
  it('retourne une note valide pour chaque lettre de l\'alphabet', () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'
    for (const char of alphabet) {
      const note = getPentatonicNote(char)
      expect(note).toMatch(/^[A-G][#b]?\d$/)  // ex: C4, F#3
    }
  })

  it('ne produit jamais de dissonance (gamme pentatonique)', () => {
    const pentatonicNotes = ['C', 'D', 'E', 'G', 'A']
    const note = getPentatonicNote('a')
    expect(pentatonicNotes.some(n => note.startsWith(n))).toBe(true)
  })
})

describe('buildChordProgression', () => {
  it('retourne une progression valide pour chaque thème', () => {
    const themes = ['terminal', 'noir', 'midnight-sun', 'arcade']
    for (const theme of themes) {
      const progression = buildChordProgression(theme)
      expect(progression).toHaveLength(4)
      expect(progression.every(chord => Array.isArray(chord.notes))).toBe(true)
    }
  })
})
```

### 2. Tests de calcul — stats & diagnostic

```typescript
// apps/web/lib/__tests__/stats.test.ts
import { describe, it, expect } from 'vitest'
import { calculateWPM, calculateAccuracy, calculateConsistency, detectBigramSlowdowns } from '../stats'

describe('calculateWPM', () => {
  it('calcule correctement à partir des keystrokes timestamps', () => {
    // 60 caractères en 30 secondes = 24 WPM (60 chars / 5 = 12 mots, en 0.5 min = 24 WPM)
    const keystrokes = Array.from({ length: 60 }, (_, i) => ({
      char: 'a',
      timestamp: i * 500,    // une frappe toutes les 500ms
      correct: true
    }))
    expect(calculateWPM(keystrokes, 30000)).toBeCloseTo(24, 0)
  })

  it('retourne 0 si aucune frappe', () => {
    expect(calculateWPM([], 30000)).toBe(0)
  })
})

describe('detectBigramSlowdowns', () => {
  it('identifie les 5 bigrams les plus lents', () => {
    // ... test avec données mockées
    const result = detectBigramSlowdowns(mockKeystrokes)
    expect(result).toHaveLength(5)
    expect(result[0].avgTime).toBeGreaterThan(result[4].avgTime)
  })
})
```

### 3. Tests de composants — Browser Mode Vitest 4

```typescript
// apps/web/components/__tests__/TypingArea.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { TypingArea } from '../TypingArea'

describe('TypingArea', () => {
  it('affiche le texte à taper', () => {
    render(<TypingArea text="hello world" onComplete={vi.fn()} />)
    expect(screen.getByText('hello world')).toBeInTheDocument()
  })

  it('marque une lettre comme correcte après frappe juste', async () => {
    const user = userEvent.setup()
    render(<TypingArea text="a" onComplete={vi.fn()} />)
    await user.keyboard('a')
    // La lettre 'a' doit avoir la classe CSS de lettre correcte
    expect(screen.getByTestId('char-0')).toHaveClass('char-correct')
  })

  it('marque une lettre comme erreur après frappe fausse', async () => {
    const user = userEvent.setup()
    render(<TypingArea text="a" onComplete={vi.fn()} />)
    await user.keyboard('b')
    expect(screen.getByTestId('char-0')).toHaveClass('char-error')
  })

  it('appelle onComplete quand le texte est entièrement tapé', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(<TypingArea text="hi" onComplete={onComplete} />)
    await user.keyboard('hi')
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
```

### 4. Tests IndexedDB

```typescript
// apps/web/lib/__tests__/db.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'   // Polyfill IndexedDB pour les tests
import { saveSession, getSessions, getKeystrokeStats } from '../db'

describe('saveSession', () => {
  it('sauvegarde et récupère une session correctement', async () => {
    const session = {
      wpm: 75,
      accuracy: 96.5,
      consistency: 88,
      duration: 60000,
      mode: 'classic' as const,
      theme: 'terminal',
    }
    const id = await saveSession(session)
    const sessions = await getSessions()
    expect(sessions.find(s => s.id === id)).toMatchObject(session)
  })
})
```

### 5. Tests E2E — Playwright 1.57+

```typescript
// e2e/typing-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Parcours utilisateur — test de typing', () => {
  test('peut faire un test complet et voir les résultats', async ({ page }) => {
    await page.goto('/')

    // Attendre le chargement du texte
    await expect(page.getByTestId('typing-area')).toBeVisible()

    // Simuler une session de typing (texte court pour les tests)
    const text = await page.getByTestId('typing-area').textContent()
    await page.keyboard.type(text ?? '')

    // La page de résultats doit apparaître
    await expect(page.getByTestId('results-page')).toBeVisible()
    await expect(page.getByTestId('wpm-display')).toBeVisible()
    await expect(page.getByTestId('accuracy-display')).toBeVisible()
  })

  test('le moteur audio s\'initialise après la première frappe', async ({ page }) => {
    await page.goto('/')
    // Vérifier que Tone.js n'est pas initialisé avant interaction
    const toneState = await page.evaluate(() => window.__TONE_STARTED__)
    expect(toneState).toBeFalsy()

    await page.keyboard.press('a')
    const toneStateAfter = await page.evaluate(() => window.__TONE_STARTED__)
    expect(toneStateAfter).toBeTruthy()
  })
})
```

---

## Commandes de test

```bash
pnpm test                    # Tous les tests unitaires
pnpm test --watch            # Mode watch (développement)
pnpm test:browser            # Tests composants (Browser Mode)
pnpm test:e2e                # Tests E2E Playwright
pnpm test:coverage           # Rapport de couverture
pnpm test --run packages/    # Tests d'un package spécifique
```

## Seuils de couverture (non négociables)

```
packages/audio-engine  : 85% minimum
packages/types         : 100% (types purs — pas de logique)
apps/web/lib           : 80% minimum
apps/web/hooks         : 75% minimum
apps/web/components    : 70% minimum
```

## Mock strategy

```typescript
// Tone.js — toujours mocker dans les tests
vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  Sampler: vi.fn().mockImplementation(() => ({
    triggerAttackRelease: vi.fn(),
    toDestination: vi.fn().mockReturnThis(),
  })),
  now: vi.fn().mockReturnValue(0),
  Reverb: vi.fn().mockImplementation(() => ({
    toDestination: vi.fn().mockReturnThis(),
    connect: vi.fn().mockReturnThis(),
  })),
}))

// Supabase — mocker le client dans les tests
vi.mock('@/lib/supabase', () => ({
  createBrowserClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
  })
}))
```
