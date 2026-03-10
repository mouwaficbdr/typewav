## Description

<!-- Résumé clair de la PR — quoi et pourquoi, pas comment -->

Closes # <!-- numéro de l'issue si applicable -->

## Type de changement

- [ ] `feat` — Nouvelle feature
- [ ] `fix` — Correction de bug
- [ ] `perf` — Amélioration de performance
- [ ] `refactor` — Refactoring sans changement de comportement
- [ ] `test` — Ajout/correction de tests
- [ ] `docs` — Documentation
- [ ] `chore` — Maintenance (deps, config, CI)

## Checklist

### Code

- [ ] `pnpm typecheck` — 0 erreur TypeScript
- [ ] `pnpm lint` — 0 warning ESLint
- [ ] `pnpm test` — Tous les tests passent
- [ ] `pnpm build` — Build de production sans erreur
- [ ] TypeScript strict — aucun `any` non justifié
- [ ] Aucun `localStorage` / `sessionStorage` (utiliser `idb`)
- [ ] Imports `motion/react` (pas `framer-motion`)
- [ ] `prefers-reduced-motion` respecté si animation

### Architecture

- [ ] Server Components par défaut — `'use client'` justifié si présent
- [ ] Types définis dans `packages/types/` si partagés
- [ ] Stores Zustand respectent la séparation des responsabilités

### Tests

- [ ] Tests écrits en premier (TDD)
- [ ] Couverture maintenue au seuil minimum du package concerné
- [ ] Tone.js mocké dans les tests

### Contenu (si applicable)

- [ ] Textes : domaine public avec source vérifiable
- [ ] Sons : libres de droits (CC0 ou originaux)
- [ ] Aucun copyright musical actif

### Commits

- [ ] Format Conventional Commits respecté
- [ ] Chaque commit est atomique et les tests passent dessus

## Screenshots / Démo

<!-- Si pertinent — UI, animations, design -->

## Notes pour le reviewer

<!-- Contexte supplémentaire, décisions non évidentes, zones d'incertitude -->
