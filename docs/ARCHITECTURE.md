# Architecture TypeWav

> Référence complète — lire avant toute décision d'architecture.

## Principe fondateur

**Local-first.** IndexedDB est toujours la source de vérité. Supabase est une couche de sync additionnelle, optionnelle, réservée aux utilisateurs premium. L'application fonctionne 100% hors ligne pour tous les utilisateurs gratuits.

## Structure du monorepo (pnpm workspaces)

```
typewav/
├── apps/
│   └── web/                          # Application Next.js 16 (App Router)
│       ├── app/                      # Routes (App Router)
│       │   ├── (typing)/             # Route group — test de typing
│       │   ├── (profile)/            # Route group — profil & analytics
│       │   ├── (settings)/           # Route group — paramètres
│       │   └── api/                  # API Routes (webhooks Stripe, etc.)
│       ├── components/               # Composants React partagés
│       │   ├── ui/                   # Primitives (Button, Modal, etc.)
│       │   ├── typing/               # Zone de frappe, curseur, résultats
│       │   ├── audio/                # Contrôles audio, sélecteur de pack
│       │   └── charts/               # Composants Recharts wrappés
│       ├── stores/                   # Zustand stores
│       ├── hooks/                    # Custom hooks React
│       ├── lib/                      # Utilitaires (idb, supabase client, etc.)
│       └── styles/                   # CSS global + variables Tailwind 4
│
├── packages/
│   ├── types/                        # @typewav/types
│   │   └── src/
│   │       ├── theme.ts              # ThemeConfig, ThemeColors, ThemeFonts
│   │       ├── soundpack.ts          # SoundPackConfig, InstrumentType
│   │       ├── collection.ts         # CollectionConfig, TextEntry
│   │       ├── session.ts            # SessionResult, KeystrokeStats
│   │       └── index.ts              # Re-exports
│   │
│   ├── audio-engine/                 # @typewav/audio-engine
│   │   └── src/
│   │       ├── pentatonic.ts         # Gamme pentatonique — mapping notes
│   │       ├── chord-progressions.ts # Progressions d'accords par thème
│   │       ├── midi-player.ts        # Lecteur MIDI (@tonejs/midi)
│   │       ├── sampler.ts            # Tone.Sampler — gestion des packs
│   │       └── engine.ts             # Interface publique du moteur
│   │
│   ├── themes/                       # @typewav/themes
│   │   ├── terminal/theme.config.ts
│   │   ├── noir/theme.config.ts
│   │   ├── midnight-sun/theme.config.ts
│   │   └── arcade/theme.config.ts
│   │
│   ├── soundpacks/                   # @typewav/soundpacks
│   │   ├── piano/soundpack.config.ts
│   │   ├── marimba/soundpack.config.ts
│   │   ├── synth-lofi/soundpack.config.ts
│   │   └── chiptune/soundpack.config.ts
│   │
│   └── collections/                  # @typewav/collections
│       ├── litterature/collection.config.ts
│       ├── code/collection.config.ts
│       ├── poesie/collection.config.ts
│       ├── philosophie/collection.config.ts
│       └── gaming/collection.config.ts
│
└── tools/
    └── cli/                          # npx create-typewav-*
        ├── src/
        │   ├── create-theme.ts
        │   ├── create-soundpack.ts
        │   └── create-collection.ts
        └── templates/
```

## Décisions architecturales clés

### Next.js App Router — Server vs Client

```
Server Components (défaut) :
  - Pages de routing
  - Layout, navigation
  - Chargement des collections de textes
  - Pages statiques (landing, about)

Client Components ('use client') :
  - TypingArea — événements clavier
  - AudioEngine — Tone.js (Web Audio API)
  - Charts Recharts — interactifs
  - Stores Zustand
  - Tout ce qui accède à IndexedDB
```

### Zustand — stores

```typescript
// Structure des stores — NE PAS MÉLANGER les responsabilités
useSessionStore     // État du test en cours (WPM, erreurs, timer)
useAudioStore       // Pack sonore actif, volume, état Tone.js
useThemeStore       // Thème actif, unlock status
useUserStore        // Préférences, rang, pseudonyme
useAnalyticsStore   // Sessions passées depuis IndexedDB
```

### IndexedDB — lib `idb` (wrapper promesse)

```typescript
// Toujours utiliser idb, jamais l'API raw IndexedDB
import { openDB } from 'idb'

// Object stores — définis dans lib/db.ts
// sessions | keystroke_stats | user_profile
// user_preferences | personal_texts | personal_records
```

### Supabase — uniquement pour premium

```typescript
// Client côté serveur — UNIQUEMENT dans Server Components et API Routes
import { createServerClient } from '@supabase/ssr'

// Client côté client — UNIQUEMENT dans Client Components authentifiés
import { createBrowserClient } from '@supabase/ssr'

// JAMAIS : import { createClient } from '@supabase/supabase-js' côté client
// sans vérification du status premium
```

### Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL       # Exposée au client — OK
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Exposée au client — OK (RLS protège)
SUPABASE_SERVICE_ROLE_KEY      # JAMAIS exposée au client — server only
STRIPE_SECRET_KEY              # JAMAIS exposée au client
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Exposée au client — OK
```

## Tone.js — règles d'implémentation

```typescript
// Initialisation — OBLIGATOIRE après interaction utilisateur
// Cette règle est non contournable (politique navigateur)
document.addEventListener('keydown', async () => {
  await Tone.start()
}, { once: true })

// Scheduling — toujours utiliser Tone.now() pour précision
synth.triggerAttackRelease(note, '8n', Tone.now())

// Lazy loading des packs — uniquement le pack actif en mémoire
// Implémenter dans packages/audio-engine/src/sampler.ts
```

## Tailwind CSS 4.0 — configuration CSS-first

```css
/* apps/web/styles/globals.css */
@import "tailwindcss";

@theme {
  --color-bg: #000000;
  --color-surface: #0A0A0A;
  --color-border: #1A1A2E;
  --color-accent: #00D4AA;
  --color-text-primary: #E8E8E8;
  --color-text-muted: #888888;
  --color-error: #FF4444;

  --font-display: 'Cormorant Garamond', serif;
  --font-ui: 'Sora', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

> IMPORTANT : Pas de `tailwind.config.js` — Tailwind 4 est CSS-first.

## Motion 12.x — animations

```typescript
// Import OBLIGATOIRE depuis motion/react (pas framer-motion)
import { motion, AnimatePresence } from 'motion/react'

// Toujours respecter prefers-reduced-motion
import { useReducedMotion } from 'motion/react'

const shouldReduceMotion = useReducedMotion()
const duration = shouldReduceMotion ? 0 : 0.2
```
