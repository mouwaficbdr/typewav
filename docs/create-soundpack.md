# Créer un pack sonore TypeWav

Ce guide explique comment créer et soumettre un soundpack pour TypeWav.

## Prérequis

- Node.js 20 LTS + pnpm 9+
- Samples audio en **domaine public** (CC0, CC-BY sans restriction commerciale, ou originaux)
- Audacity ou équivalent pour normaliser le volume

## Générer la structure

```bash
npx create-typewav-soundpack nom-du-pack
```

Cette commande crée :

```
nom-du-pack/
├── soundpack.config.ts   # Config principale
├── samples/              # Fichiers audio
│   ├── C4.mp3
│   └── ...
├── package.json
└── README.md
```

## Notes requises

Le moteur audio TypeWav (Tone.js + gamme pentatonique) utilise les notes suivantes :

| Note | Octave  | Priorité    |
| ---- | ------- | ----------- |
| C    | 3, 4, 5 | Obligatoire |
| D    | 4       | Obligatoire |
| E    | 4       | Obligatoire |
| G    | 4       | Obligatoire |
| A    | 4       | Obligatoire |

Tone.js interpole les notes manquantes — fournir au moins les 5 notes pentatoniques de base (C4 D4 E4 G4 A4) suffit. Plus de notes = meilleure qualité.

## Remplir `soundpack.config.ts`

```typescript
import type { SoundPackConfig } from '@typewav/types';

const soundpack: SoundPackConfig = {
  id: 'nom-du-pack',
  name: 'Nom du Pack',
  instrument: 'sampler',
  samples: {
    C3: './samples/C3.mp3',
    C4: './samples/C4.mp3',
    D4: './samples/D4.mp3',
    E4: './samples/E4.mp3',
    G4: './samples/G4.mp3',
    A4: './samples/A4.mp3',
    C5: './samples/C5.mp3',
  },
  baseUrl: '', // Laissez vide — l'application gère le chemin
};

export default soundpack;
```

## Exigences sur les fichiers audio

| Critère                     | Requis                                          |
| --------------------------- | ----------------------------------------------- |
| Formats                     | `.mp3` (requis), `.ogg` recommandé              |
| Taille totale               | **< 2 MB**                                      |
| Fréquence d'échantillonnage | 44100 Hz                                        |
| Volume normalisé            | -6 dBFS peak                                    |
| Licence                     | CC0, CC-BY ou originaux — aucun copyright actif |

## Vérifier les licences

Pour les samples trouvés en ligne :

- [Freesound.org](https://freesound.org) — filtrer par licence CC0
- [SampleSwap](https://sampleswap.org) — domaine public
- Samples originaux enregistrés par vous-même

**Ne jamais inclure** de samples sous copyleft restrictif ou à usage commercial limité.

## Tester localement

1. Copier le dossier dans `packages/soundpacks/src/nom-du-pack/`
2. Exporter depuis `packages/soundpacks/src/index.ts`
3. Sélectionner le pack dans l'UI et jouer un texte
4. Vérifier : `pnpm typecheck` — 0 erreur

## Soumettre une PR

1. Fork le dépôt
2. Copier votre dossier dans `packages/soundpacks/src/`
3. Ajouter l'export dans `packages/soundpacks/src/index.ts`
4. PR avec titre `feat(soundpacks): add <nom-du-pack> soundpack`
5. Inclure dans la PR : source de chaque sample + licence

**Important** : les fichiers audio ne doivent pas dépasser 2 MB total. Les samples trop lourds seront refusés.
