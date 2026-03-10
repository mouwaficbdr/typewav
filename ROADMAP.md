# TypeWav — Roadmap publique

> Dernière mise à jour : 10 Mars 2026

## Statut actuel : Phase 4 terminée — Backlog en cours

## ✅ Phases complétées

### Phase 0 — Fondations ✅

- [x] Monorepo pnpm workspaces configuré
- [x] Next.js 16.1 + TypeScript strict + Tailwind CSS 4.0
- [x] Design system — tokens CSS, polices Google Fonts
- [x] Prototype Tone.js — une note par keydown
- [x] Zone de frappe minimale fonctionnelle
- [x] Vitest configuré — 115 tests qui passent

### Phase 1 — MVP ✅

- [x] Moteur audio complet (pentatonique + progressions d'accords)
- [x] Test de typing complet — WPM, accuracy, consistency
- [x] Page de résultats — heatmap clavier SVG, stats, recommandation
- [x] Stockage IndexedDB (sessions, stats, préférences)
- [x] Packs sonores core (Piano, Marimba, Synth, Chiptune)
- [x] 4 thèmes officiels (Terminal, Noir, Soleil de minuit, Arcade)
- [x] 3 collections officielles (Littérature, Code, Poésie)
- [x] Mode Classiques MIDI — 4 pièces domaine public
- [x] Page d'accueil interactive — sélection collection, mode, pack sonore

### Phase 2 — Enrichissement ✅

- [x] Mode Apprentissage complet (5 niveaux, schéma clavier SVG)
- [x] Mode Code (JS, Python, Rust — détection de langage automatique)
- [x] Difficulté adaptative en temps réel
- [x] Dashboard profil — graphes Recharts, heatmap temporelle
- [x] Système de rangs narratifs (Novice → Maître)
- [x] Jalons débloquables (vitesse, précision, régularité, sessions)
- [x] Ghost mode — curseur fantôme sur meilleure session précédente

### Phase 3 — Social & Open Source ✅

- [x] Replay partageable (encodage base64, lien URL)
- [x] Challenge direct (URL partageable avec texte et cible WPM)
- [x] Leaderboards contextuels (par collection / mode / semaine)
- [x] CLI de scaffolding (`npx create-typewav-*`)
- [x] Documentation de contribution complète
- [x] Internationalisation FR/EN (next-intl)

### Phase 4 — Monétisation ✅

- [x] Supabase Auth (@supabase/ssr) — connexion email/password + OAuth
- [x] Stripe Checkout — abonnement mensuel (€4.99) et annuel (€39.99)
- [x] Packs sonores premium (Cinematic, Phonk, Jazz Piano)
- [x] Page de transparence financière
- [x] Webhook Stripe — provisioning premium automatique

---

## 🚧 Backlog en cours

- [ ] **Collections** — Philosophie et Gaming (domaine public)
- [ ] **MIDI catalogue complet** — 8 pièces (4 ajoutées en Phase 1, 4 en attente)
- [ ] **Sync cloud cross-device** — IndexedDB ↔ Supabase pour comptes premium
- [ ] **Ko-fi / GitHub Sponsors** — don volontaire

## 🔮 Backlog (post-Phase 4)

- [ ] Saisons thématiques communautaires _(requiert audience + rentabilité)_
- [ ] Mode multijoueur temps réel _(requiert infrastructure serveur)_
- [ ] API publique pour intégrations tierces
- [ ] Application mobile (PWA)
- [ ] Support QWERTZ (DE)

---

## Contributions bienvenues

Les items marqués **contributions welcome** dans nos issues GitHub sont ouverts à la communauté. Lire [CONTRIBUTING.md](./CONTRIBUTING.md) avant de commencer.

**Priorités actuelles pour contributions externes :**

- Nouvelles collections de textes (domaine public)
- Nouveaux thèmes communautaires
- Traductions (ES, DE, PT...)

_Créer une issue avant de commencer un gros travail — éviter les doublons._
