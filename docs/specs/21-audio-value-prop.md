# Spec 21 — Audio Value Prop + Rang en Contexte

> **Priorité : 🔵 VISION**
> **Effort estimé : 3-4 fichiers**
> **Commits cibles :**
>
> - `feat(home): add audio preview button to surface value prop on landing`
> - `feat(home): add contextual rank badge to typing interface`

---

## Contexte et problème

### Problème 1 — La valeur audio est nulle avant la première frappe

Un visiteur arrive sur TypeWav et voit un éditeur de texte sombre. Le texte `"chaque frappe produit une note"` est en 8pt gris, invisible. Le concept musical — la différenciation principale — n'existe pas dans les 8 premières secondes d'une visite.

**Le Skeptic quitte en ~8 secondes.** Sans preuve sensorielle de l'audio, TypeWav ressemble à n'importe quel clone de MonkeyType.

Référence : **Splice** (plateforme de samples musicaux) démarre un sample en autoplay à l'arrivée sur le site. **Soundcloud** joue un preview sans interaction. Ces produits ont compris que l'audio se prouve, il ne se décrit pas.

### Problème 2 — Le rang n'est visible que sur la page profil

Le système de rangs (Novice → Fantôme) est soigneusement conçu mais invisible sur la home. Un utilisateur qui vient de passer "Architecte" n'a aucun moment de fierté dans l'interface principale — il doit aller sur `/profil` pour voir son rang.

**Le rang visible en contexte est le principal vecteur de partage organique.** Les screenshots "J'ai atteint Architecte sur TypeWav" ne peuvent pas exister si le rang n'est pas dans l'interface principale.

---

## Objectif 1 — Bouton de preview audio

Un bouton "▶ Aperçu sonore" sur la landing, qui joue une séquence de notes de démonstration de 3-4 secondes sans que l'utilisateur ait à taper. C'est la seule action requise pour entendre TypeWav.

- Respecte la contrainte Web Audio (Tone.js → `Tone.start()` obligatoire après clic)
- Joue une séquence de 8-10 notes pentatoniques avec le pack sonore actif
- Bouton visible uniquement si `(pointer: fine)` (desktop) ou en position proéminente
- Après la démo, le bouton se transforme en "Taper pour rejouer"
- `prefers-reduced-motion` : désactiver les animations de feedback mais garder le son

---

## Objectif 2 — Badge de rang en contexte

Afficher le rang courant de l'utilisateur dans l'interface de frappe (`HomeClient`), sous forme d'un badge compact :

```
  [ Architecte · 71 WPM ]
```

- Visible uniquement si au moins 1 session complétée (rang non "Novice" ou sessions > 0)
- Lié au `useProgressionStore` ou à une lecture directe IndexedDB
- Cliquable → navigue vers `/profil`
- S'anime lors d'un changement de rang (MilestoneToast existe déjà, ce badge est l'état persistant)

---

## Fichiers à modifier / créer

```
# Créer
apps/web/components/typing/AudioPreviewButton.tsx      ← bouton demo audio
apps/web/hooks/useAudioPreview.ts                       ← logique de la démo

# Modifier
apps/web/components/typing/HomeClient.tsx               ← intégrer les deux features
apps/web/messages/fr.json                               ← clés preview.*, rank.*
apps/web/messages/en.json
```

---

## Tests à écrire (TDD — RED avant GREEN)

```typescript
describe('AudioPreviewButton', () => {
  it('est rendu dans la landing', () => {});
  it('initialise Tone.js au click (pas avant)', async () => {
    // Vérifier que initialize() est appelé au click
  });
  it('joue une séquence de notes après click', async () => {
    // playNote appelé plusieurs fois après click
  });
  it('ne joue pas de notes avant le click (contrainte navigateur)', () => {
    // Render du composant → playNote non appelé
  });
});

describe('Rang en contexte — HomeClient', () => {
  it('affiche le badge de rang si au moins 1 session existe', () => {
    // Mock useProgressionStore → rank = 'architecte'
    // Badge visible
  });
  it("n'affiche pas le badge si aucune session (Novice sans historique)", () => {
    // rank = 'novice', sessions.length = 0 → badge absent
  });
  it('le badge est un lien vers /profil', () => {});
});
```

---

## Implémentation

### `useAudioPreview.ts`

```typescript
'use client';

/**
 * useAudioPreview — joue une séquence de démonstration audio.
 * Client Component justifié : Tone.js browser-only, state de lecture.
 */

import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useCallback, useState } from 'react';

const DEMO_SEQUENCE: Array<{
  char: string;
  wordIndex: number;
  delayMs: number;
}> = [
  { char: 't', wordIndex: 0, delayMs: 0 },
  { char: 'y', wordIndex: 0, delayMs: 150 },
  { char: 'p', wordIndex: 0, delayMs: 280 },
  { char: 'e', wordIndex: 0, delayMs: 420 },
  { char: 'w', wordIndex: 1, delayMs: 650 },
  { char: 'a', wordIndex: 1, delayMs: 780 },
  { char: 'v', wordIndex: 1, delayMs: 890 },
  { char: 't', wordIndex: 2, delayMs: 1100 },
  { char: 'y', wordIndex: 2, delayMs: 1230 },
  { char: 'p', wordIndex: 2, delayMs: 1350 },
  { char: 'e', wordIndex: 3, delayMs: 1550 },
];

export function useAudioPreview() {
  const { initialize, playNote } = useAudioEngine();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const playPreview = useCallback(async () => {
    if (isPlaying) return;
    await initialize(); // contrainte navigateur : Tone.start() après clic utilisateur
    setIsPlaying(true);

    for (const note of DEMO_SEQUENCE) {
      await new Promise<void>((resolve) => setTimeout(resolve, note.delayMs));
      await playNote(note.char, note.wordIndex);
    }

    setIsPlaying(false);
    setHasPlayed(true);
  }, [isPlaying, initialize, playNote]);

  return { playPreview, isPlaying, hasPlayed };
}
```

### `AudioPreviewButton.tsx`

```tsx
'use client';

/**
 * AudioPreviewButton — bouton de démonstration audio sur la landing.
 * Client Component justifié : Tone.js browser-only, gestion de l'état.
 */

import { useAudioPreview } from '@/hooks/useAudioPreview';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

export function AudioPreviewButton() {
  const t = useTranslations('preview');
  const { playPreview, isPlaying, hasPlayed } = useAudioPreview();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={() => void playPreview()}
      disabled={isPlaying}
      aria-label={t('ariaLabel')}
      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: 'transparent',
        border: '1px solid var(--color-accent)',
        borderRadius: '6px',
        color: 'var(--color-accent)',
        cursor: isPlaying ? 'wait' : 'pointer',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        transition: 'opacity 0.15s',
        opacity: isPlaying ? 0.6 : 1,
      }}
      className="hover:opacity-80"
    >
      <span aria-hidden="true">{isPlaying ? '♪' : '▶'}</span>
      {hasPlayed ? t('replay') : t('play')}
    </motion.button>
  );
}
```

### Badge de rang dans `HomeClient.tsx`

Dans le hook du composant, lire le rang depuis le store :

```typescript
const { userProfile } = useProgressionStore();
const hasHistory = /* lire depuis IndexedDB ou store */ sessions.length > 0;
```

Ajouter dans la zone header/controls (avant la TypingArea) :

```tsx
{
  userProfile && hasHistory && userProfile.rank !== 'novice' && (
    <Link
      href={`/${locale}/profil`}
      aria-label={t('rank.viewProfile')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '20px',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.75rem',
        textDecoration: 'none',
        transition: 'color 0.15s',
      }}
      className="hover:text-[var(--color-text-primary)]"
    >
      <span style={{ color: 'var(--color-accent)' }}>
        {t(`ranks.${userProfile.rank}`)}
      </span>
      <span aria-hidden="true">·</span>
      <span>{userProfile.averageWpm} WPM</span>
    </Link>
  );
}
```

Intégrer `AudioPreviewButton` dans la section d'instruction (avant que l'utilisateur ait commencé à taper) :

```tsx
{
  !isTyping && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <AudioPreviewButton />
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
        {t('preview.orStartTyping')}
      </span>
    </div>
  );
}
```

### Clés i18n

**`fr.json`** :

```json
"preview": {
  "play": "Aperçu sonore",
  "replay": "Rejouer l'aperçu",
  "ariaLabel": "Écouter un aperçu de l'expérience sonore TypeWav",
  "orStartTyping": "ou commencez à taper"
},
"rank": {
  "viewProfile": "Voir mon profil et ma progression"
},
"ranks": {
  "novice": "Novice",
  "apprenti": "Apprenti",
  "operateur": "Opérateur",
  "architecte": "Architecte",
  "fantome": "Fantôme"
}
```

**`en.json`** :

```json
"preview": {
  "play": "Hear a preview",
  "replay": "Replay preview",
  "ariaLabel": "Listen to a preview of the TypeWav audio experience",
  "orStartTyping": "or start typing"
},
"rank": {
  "viewProfile": "View my profile and progression"
},
"ranks": {
  "novice": "Novice",
  "apprenti": "Apprentice",
  "operateur": "Operator",
  "architecte": "Architect",
  "fantome": "Ghost"
}
```

---

## Considérations techniques

### Sequence de démo : ne pas hardcoder des timings irréalistes

La séquence `DEMO_SEQUENCE` simule un vrai rythme de frappe (150-200ms par touche). Elle joue les notes correspondant aux lettres de "typewav type" via le moteur audio existant, donc elle s'adapte automatiquement au pack sonore actif et au thème actif.

### Contrainte Web Audio

La séquence ne peut pas jouer automatiquement au chargement de la page (Web Audio API restriction navigateur). Elle **doit** être déclenchée par un clic utilisateur. `useAudioPreview` appelle `initialize()` au début de `playPreview` — c'est correct.

### Position UX du bouton

Le bouton doit être visible **avant** que l'utilisateur commence à taper. Il peut être masqué une fois la session démarrée (il ne sert à rien pendant qu'on tape). Utiliser un état `isTyping` (déjà géré dans `HomeClient` via `position > 0 || isActive`).

---

## Validation — Checklist d'acceptance

- [ ] `pnpm typecheck` : 0 erreur
- [ ] `pnpm test` : tous les tests passent
- [ ] Bouton "Aperçu sonore" visible sur la landing (pas encore tapé)
- [ ] Click → séquence de 11 notes jouée avec le pack sonore actif
- [ ] Bouton transformé en "Rejouer l'aperçu" après la première écoute
- [ ] Bouton disparaît ou devient inactif une fois la session commencée
- [ ] Badge de rang visible pour les utilisateurs avec historique (non-Novice)
- [ ] Badge cliquable → `/profil`
- [ ] Badge invisible pour les nouveaux utilisateurs sans historique
- [ ] `prefers-reduced-motion` : animations désactivées, son fonctionnel
- [ ] `pnpm build` : 0 erreur

---

## Commits

```bash
# Commit 1
feat(home): add audio preview button to surface value prop on landing

New AudioPreviewButton component plays a 11-note demo sequence
using the active sound pack. Triggered by user click (Web Audio
API constraint). Converts to "replay" after first listen.
Hides once a typing session has started.

# Commit 2
feat(home): add contextual rank badge to typing interface

Users with at least 1 session and rank above Novice now see
a compact rank badge (rank + avg WPM) in the typing interface.
Links to /profil. Invisible for new users.
```
