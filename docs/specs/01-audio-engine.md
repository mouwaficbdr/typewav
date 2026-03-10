# Spec 01 — Moteur musical (Axe 1)

## Décision finale

**Mode génératif (A+C)** : gamme pentatonique + progressions d'accords contextuelles par mot.  
**Mode Classiques** : séquences MIDI de pièces du domaine public via @tonejs/midi.  
**Comportement erreur** : silence total. Pas de fausse note.  
**Comportement correction** : reprise avec micro-reverb (Tone.Reverb decay 0.3s, wet 0.4).

## Package : `packages/audio-engine`

### Interface publique — `engine.ts`

```typescript
export interface AudioEngine {
  // Initialiser après premier événement utilisateur (OBLIGATOIRE)
  initialize(): Promise<void>

  // Déclencher une note (frappe correcte)
  playNote(char: string, wordIndex: number): void

  // Silence (erreur)
  triggerSilence(): void

  // Reprise après correction
  triggerResume(): void

  // Changer de pack sonore (lazy load)
  loadSoundPack(packId: string): Promise<void>

  // Changer de thème (change la progression d'accords)
  setTheme(themeId: string): void

  // Pour le mode Classiques — avancer d'un cran dans la séquence MIDI
  advanceMidiSequence(): void

  // Charger un fichier MIDI (mode Classiques)
  loadMidiPiece(pieceId: string): Promise<void>
}
```

### Mode génératif — `pentatonic.ts`

**Algorithme A+C :**

```
Gamme pentatonique de Do majeur : C D E G A (+ octaves)
Distribution aux 26 lettres : cycling sur les 5 notes × 3 octaves (15 positions)

a=C4, b=D4, c=E4, d=G4, e=A4,
f=C5, g=D5, h=E5, i=G5, j=A5,
k=C3, l=D3, m=E3, n=G3, o=A3,
p=C4, q=D4, r=E4, s=G4, t=A4,
u=C5, v=D5, w=E5, x=G5, y=A5, z=C3
```

**Progressions d'accords par thème :**

```typescript
// Terminal : progression mineure sombre
['Am', 'G', 'F', 'Em']

// Noir : progression jazz
['Dm7', 'G7', 'Cmaj7', 'Am7']

// Soleil de minuit : progression ambient
['Fmaj7', 'Am', 'Em', 'Cmaj7']

// Arcade : progression majeure pop
['C', 'G', 'Am', 'F']
```

À chaque nouveau mot, on avance d'un accord dans la progression. Les notes du mot sont contraintes aux notes de cet accord intersectées avec la gamme pentatonique.

### Mode Classiques — `midi-player.ts`

Catalogue initial (domaine public garanti — vérifier IMSLP) :

```
fur-elise          — Beethoven (1810)
clair-de-lune      — Debussy (~1890)
gymnopedie-1       — Satie (1888)
prelude-bwv846     — Bach (1722)
korobeiniki        — Traditionnel russe (XIXe s.)
nocturne-op9-no2   — Chopin (1832)
canon-pachelbel    — Pachelbel (~1694)
```

Chaque frappe correcte = `advanceMidiSequence()` → joue la note suivante.  
Erreur = silence, séquence figée.  
Correction = reprend à la note suivante + micro-reverb.

### Bibliothèque de timbres — `sampler.ts`

```typescript
// Packs core (gratuits) — samples dans public/sounds/{packId}/
'piano'           // Piano acoustique
'marimba'         // Marimba
'synth-lofi'      // Synthétiseur lo-fi
'chiptune'        // 8-bit

// Packs premium (Phase 4)
'cinematic'       // Cordes + piano
'phonk'           // Synthés sombres
'jazz-piano'      // Piano jazz
```

### Feedback visuel synchronisé

**À implémenter dans `apps/web/components/typing/TypingArea.tsx` :**

```typescript
// Frappe correcte : micro-pulsation sur lettre active
// scale 1.0 → 1.03 → 1.0, durée 80ms
// Implémentation : CSS animation ou Motion micro-transition

// Erreur : aucune animation — immobilité totale

// Correction : fade-in lettre
// opacity 0.6 → 1.0, durée 120ms
```

## Règles non négociables

```
✅ Tone.start() UNIQUEMENT après keydown event (politique navigateur)
✅ Lazy loading — uniquement le pack actif en mémoire
✅ Les erreurs produisent du SILENCE — jamais une fausse note
✅ Tous les MIDI sont domaine public — vérifier sur IMSLP avant ajout
✅ La musique suit le rythme de l'utilisateur — jamais l'inverse
```

## Tests requis

```
[ ] getPentatonicNote — toutes les lettres retournent une note valide
[ ] buildChordProgression — chaque thème retourne 4 accords valides
[ ] triggerSilence — aucun son produit lors d'une erreur
[ ] loadSoundPack — lazy loading (pack non actif pas en mémoire)
[ ] advanceMidiSequence — avance correctement dans la séquence
[ ] initialize — ne s'appelle pas automatiquement (doit attendre keydown)
```
