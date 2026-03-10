# Spec 00 — Vue d'ensemble du projet TypeWav

> Source de vérité — dernière mise à jour : 10 Mars 2026

## Identité

- **Nom** : TypeWav (Type + Wave)
- **Type** : Application web de typing immersif et musical
- **Statut** : Open source — projet portfolio
- **URL** : typewav.app (à confirmer)

## Vision

Créer la version définitive de MonkeyType — open source, pensée portfolio — différenciée par une expérience sensorielle musicale profonde. Le typing est le cœur. La musique est l'élément de confort, l'élément de différence.

## Principe directeur absolu

> Des defaults intelligents, toujours overridables.

Toute feature a un comportement par défaut excellent. Tout comportement par défaut est désactivable ou configurable. L'utilisateur gratuit n'est jamais frustré dans sa pratique.

## Stack technique vérifiée au 10 Mars 2026

```json
{
  "runtime": "Node.js 20 LTS (≥20.19.0)",
  "framework": "Next.js 16.1",
  "react": "19.2",
  "typescript": "5.x (strict)",
  "css": "Tailwind CSS 4.0",
  "animation": "Motion 12.x (import: motion/react)",
  "state": "Zustand 5.0.8",
  "audio": "Tone.js 15.x",
  "midi": "@tonejs/midi (latest)",
  "charts": "Recharts 3.8.0",
  "db_local": "idb (wrapper IndexedDB)",
  "db_cloud": "@supabase/supabase-js 2.98.0",
  "auth": "@supabase/ssr 0.9.0",
  "testing": "Vitest 4.0.18",
  "testing_browser": "@vitest/browser-playwright 4.0.18",
  "i18n": "next-intl (latest)",
  "fonts": "next/font (Google Fonts)",
  "hosting": "Vercel (Hobby — gratuit)",
  "package_manager": "pnpm 9+"
}
```

**INTERDIT** : Node.js 18 (EOL Avril 2025), `framer-motion` (remplacé par `motion`), `@supabase/auth-helpers-nextjs` (remplacé par `@supabase/ssr`), `tailwind.config.js` (Tailwind 4 est CSS-first).

## Design system — tokens

```
Background    : #000000
Surface       : #0A0A0A
Border        : #1A1A2E
Accent        : #00D4AA
Text primary  : #E8E8E8
Text muted    : #888888
Error         : #FF4444
Success       : #00D4AA

Font display  : Cormorant Garamond (Google Fonts)
Font UI       : Sora (Google Fonts)
Font mono     : JetBrains Mono (Google Fonts)
```

## 10 axes fonctionnels

1. **Couche musicale immersive** → @docs/specs/01-audio-engine.md
2. **Diagnostic intelligent post-test** → @docs/specs/02-diagnostic.md
3. **Modes d'entraînement ciblés** → @docs/specs/03-training-modes.md
4. **Design system premium** → @docs/specs/04-design-system.md
5. **Progression narrative** → @docs/specs/05-progression.md
6. **Contenu éditorial thématique** → @docs/specs/06-content.md
7. **Difficulté adaptative** → @docs/specs/07-adaptive-difficulty.md
8. **Social layer réinventé** → @docs/specs/08-social.md
9. **Profil & analytics long terme** → @docs/specs/09-analytics.md
10. **Extensibilité open source** → @docs/specs/10-extensibility.md

## Modèle de monétisation

```
Gratuit (forever) :
  - 100% des features de typing
  - Stockage local IndexedDB illimité
  - Thèmes et packs core
  - Diagnostic et analytics locaux

Premium (4€/mois ou 30€/an) :
  - Sync cloud cross-device (Supabase)
  - Packs sonores premium (Cinematic, Phonk, Jazz Piano)
  - Historique cloud illimité

Autres :
  - Don volontaire (Ko-fi / GitHub Sponsors)
  - Licence commerciale (usage dans produit tiers)
  - Sponsoring (phase 4 uniquement, cohérence univers)
```

## Roadmap de lancement

| Phase              | Durée        | Objectif                                 | Statut          |
| ------------------ | ------------ | ---------------------------------------- | --------------- |
| 0 — Fondations     | Sem. 1-2     | Monorepo + design + prototype audio      | ✅ Terminée     |
| 1 — MVP            | Sem. 3-6     | Test fonctionnel de bout en bout         | ✅ Terminée     |
| 2 — Enrichissement | Sem. 7-10    | Modes, progression, analytics            | ✅ Terminée     |
| 3 — Social & OSS   | Sem. 11-14   | Replay, CLI, i18n                        | ✅ Terminée     |
| 4 — Monétisation   | Sem. 15-18   | Auth, Stripe, packs premium              | ✅ Terminée     |
| **REFONTE**        | **en cours** | **Bugs critiques + qualité UX + vision** | 🔴 **En cours** |

## Phase Refonte — 10 Mars 2026

Suite à l'audit produit APEX, 18 axes d'amélioration ont été identifiés.
Voir le backlog complet et ordonné : `docs/specs/11-refonte-audit-2026.md`
Chaque item a sa spec détaillée : `docs/specs/12-21-*.md`

### Bugs critiques à corriger en priorité absolue

| #   | Bug                                               | Spec    | Impact                    |
| --- | ------------------------------------------------- | ------- | ------------------------- |
| 1   | `wpmNet` toujours égal à `wpm` dans les résultats | spec-12 | Scoring honnête cassé     |
| 2   | Backspace ignoré dans TypingArea                  | spec-13 | Rétention bloquée         |
| 3   | Redirect post-login ignore la locale              | spec-14 | Auth cassée sur locale EN |
| 4   | Sync cloud non disponible mais checkout actif     | spec-16 | Risque légal (EU)         |
