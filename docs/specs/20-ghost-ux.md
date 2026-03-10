# Spec 20 — Ghost Mode : Discoverability et UX

> **Priorité : 🟡 MOYEN TERME**
> **Effort estimé : 2 fichiers**
> **Commit cible : `feat(typing): improve ghost mode discoverability with locked state`**

---

## Contexte et problème

### Situation actuelle

Dans `HomeClient.tsx`, le bouton ghost mode est conditionnel :

```tsx
{ghostTimings && ghostTimings.length > 0 && (
  <button onClick={...}>Ghost</button>
)}
```

Si `ghostTimings` est vide (aucun record personnel avec keystrokeData), le bouton est **totalement absent**. Le mode ghost — la feature la plus innovante de TypeWav — est invisible pour 100% des nouveaux utilisateurs.

### Comparaison best-in-class

**Duolingo** : les features verrouillées sont affichées grisées avec un cadenas et un CTA clair ("Complète 5 leçons pour débloquer").
**MonkeyType** : le mode PB (Personal Best) cue est visible dès le premier test, avec un message d'activation.

### Impact

- Zéro retention hook pour les nouveaux utilisateurs (ils ne savent pas ce qui les attend)
- Zero contenu partageble (le screenshot de ghost mode est viral — streams Twitch, vidéos YouTube)
- La différenciation principale de TypeWav reste cachée derrière un gate invisible

---

## Objectif

Afficher le bouton ghost mode en état "verrouillé" pour les utilisateurs sans record, avec :

1. Un état visuel différencié (icône cadenas, opacité réduite)
2. Un tooltip ou message explicatif ("Complète un test pour débloquer le mode fantôme")
3. Un unlock animé au premier record (milestone existant ou nouveau)

---

## Fichiers à modifier

```
apps/web/components/typing/HomeClient.tsx      ← logique du bouton ghost
apps/web/messages/fr.json                       ← clés ghost.*
apps/web/messages/en.json
```

---

## Tests à écrire (TDD — RED avant GREEN)

```typescript
describe('HomeClient — ghost mode button', () => {
  it('affiche le bouton ghost verrouillé si aucun record personnel', () => {
    // ghostTimings = undefined ou []
    // Bouton visible mais désactivé avec aria-disabled
    // Texte ou tooltip : "Complète un test pour débloquer"
  });

  it('affiche le bouton ghost actif si un record existe', () => {
    // ghostTimings = [45, 67, 89, ...]
    // Bouton actif, aria-disabled absent
  });

  it('affiche un tooltip au hover sur le bouton verrouillé', () => {
    // title ou aria-describedby avec le message explicatif
  });

  it('ne lance pas le ghost mode si le bouton est verrouillé', () => {
    // Click sur bouton verrouillé → aucun changement d'état ghost
  });
});
```

---

## Implémentation

### `HomeClient.tsx` — remplacer la logique d'affichage conditionnel

**Identifier** le bloc qui rend le bouton ghost (actuellement conditionnel sur `ghostTimings`).

**Avant :**

```tsx
{
  ghostTimings && ghostTimings.length > 0 && (
    <button onClick={handleGhostToggle}>
      {isGhostMode ? 'Désactiver Ghost' : 'Ghost'}
    </button>
  );
}
```

**Après :**

```tsx
{
  /* Ghost mode — toujours visible, verrouillé si pas de record */
}
{
  (() => {
    const hasGhostData = ghostTimings && ghostTimings.length > 0;
    return (
      <button
        onClick={hasGhostData ? handleGhostToggle : undefined}
        aria-disabled={!hasGhostData}
        title={!hasGhostData ? t('ghost.lockedTooltip') : undefined}
        aria-label={
          hasGhostData
            ? isGhostMode
              ? t('ghost.disable')
              : t('ghost.enable')
            : t('ghost.locked')
        }
        style={{
          /* styles existants */
          opacity: hasGhostData ? 1 : 0.45,
          cursor: hasGhostData ? 'pointer' : 'not-allowed',
          // Ajouter une icône cadenas si verrouillé
        }}
      >
        {!hasGhostData && (
          <span aria-hidden="true" style={{ marginRight: '4px' }}>
            🔒
          </span>
        )}
        {isGhostMode ? t('ghost.active') : t('ghost.label')}
      </button>
    );
  })();
}
```

**Note important** : ne pas utiliser l'attribut `disabled` sur le bouton (il masquerait le tooltip). Utiliser `aria-disabled="true"` + `cursor: not-allowed` + guard sur `onClick`.

### Clés i18n

**`fr.json`** :

```json
"ghost": {
  "label": "Fantôme",
  "active": "Fantôme actif",
  "enable": "Activer le mode Fantôme",
  "disable": "Désactiver le mode Fantôme",
  "locked": "Mode Fantôme verrouillé",
  "lockedTooltip": "Complète un test pour débloquer le mode Fantôme — ton meilleur résultat servira de référence"
}
```

**`en.json`** :

```json
"ghost": {
  "label": "Ghost",
  "active": "Ghost active",
  "enable": "Enable Ghost mode",
  "disable": "Disable Ghost mode",
  "locked": "Ghost mode locked",
  "lockedTooltip": "Complete a test to unlock Ghost mode — your best result will be used as reference"
}
```

---

## Considérations UX supplémentaires

### Icône cadenas

Utiliser un caractère Unicode `🔒` ou `⚿` plutôt qu'une image. Compatible avec tous les navigateurs, pas de dépendance externe.

### Animation d'unlock

Quand `ghostTimings` passe de vide à non-vide (premier record enregistré) :

- Le bouton ghost "se déverrouille" avec une animation Motion (scale 1 → 1.1 → 1 + opacity 0.45 → 1)
- Ajouter `<AnimatePresence>` autour du cadenas pour le faire disparaître avec une animation

```tsx
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const shouldReduceMotion = useReducedMotion();

<AnimatePresence>
  {!hasGhostData && (
    <motion.span
      aria-hidden="true"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
    >
      🔒
    </motion.span>
  )}
</AnimatePresence>;
```

### Persistance du contexte entre sessions

Vérifier que `ghostTimings` est chargé depuis `getPersonalRecords()` + `getSessionById()` correctement dans `HomeClient`. Ne pas régresser sur ce comportement existant.

---

## Validation — Checklist d'acceptance

- [ ] `pnpm typecheck` : 0 erreur
- [ ] `pnpm test` : tous les tests passent
- [ ] **Nouveau utilisateur** : bouton Ghost visible, état verrouillé (cadenas, opacité réduite)
- [ ] **Hover** sur bouton verrouillé : tooltip explicatif visible
- [ ] **Click** sur bouton verrouillé : aucune action (pas de crash, pas d'état incohérent)
- [ ] **Après premier test** : bouton Ghost actif (cadenas disparu, opacité pleine)
- [ ] `prefers-reduced-motion` : animation d'unlock désactivée
- [ ] `pnpm build` : 0 erreur

---

## Commit

```
feat(typing): improve ghost mode discoverability with locked state UI

Ghost mode button was completely absent for users with no personal
record, making the most innovative feature invisible to all new users.

Now the button is always visible with a locked state (padlock icon,
reduced opacity, not-allowed cursor, tooltip explanation).
Unlocks with an animation after the first completed session.
i18n keys added for both FR and EN.
```
