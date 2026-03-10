# Conventions de commits TypeWav

> Conventional Commits 1.0 — https://www.conventionalcommits.org

## Format

```
type(scope): description courte en minuscules

[corps optionnel — explication du POURQUOI, pas du QUOI]

[footer optionnel — BREAKING CHANGE, closes #issue]
```

## Types

| Type | Usage |
|------|-------|
| `feat` | Nouvelle feature visible par l'utilisateur |
| `fix` | Correction de bug |
| `perf` | Amélioration de performance (pas de nouvelle feature) |
| `refactor` | Refactoring sans changement de comportement |
| `test` | Ajout ou correction de tests uniquement |
| `docs` | Documentation uniquement |
| `chore` | Tâches de maintenance (deps, config, CI) |
| `style` | Formatage, whitespace (pas de logique) |
| `build` | Système de build, scripts |

## Scopes

```
audio         # packages/audio-engine
types         # packages/types
themes        # packages/themes
soundpacks    # packages/soundpacks
collections   # packages/collections
cli           # tools/cli
typing        # Zone de frappe principale
diagnostic    # Diagnostic post-test
modes         # Modes d'entraînement
progression   # Système de rangs et jalons
analytics     # Dashboard profil
social        # Replay, challenges, leaderboards
design        # Design system, tokens, thèmes
db            # IndexedDB, schéma, migrations
auth          # Supabase Auth
premium       # Features premium, Stripe
ci            # GitHub Actions, workflows
deps          # Dépendances
i18n          # Internationalisation
```

## Exemples

```bash
# Feature
feat(audio): add pentatonic scale note mapping for 26 letters
feat(typing): implement real-time WPM calculation with sliding window
feat(modes): add home row learning mode with finger position guide
feat(progression): implement narrative rank system with 5 tiers
feat(diagnostic): generate bigram slowdown detection and recommendations
feat(themes): add Noir theme with jazz piano soundpack integration
feat(db): implement IndexedDB session storage with idb library
feat(auth): integrate Supabase SSR auth for premium accounts
feat(premium): add Stripe checkout for monthly/annual subscription

# Fix
fix(audio): prevent Tone.js initialization before first user interaction
fix(typing): correct WPM calculation edge case on empty word list
fix(db): handle IndexedDB upgrade migrations between schema versions

# Performance
perf(audio): lazy load sound samples — load active pack only
perf(typing): debounce keystroke stats aggregation to reduce IndexedDB writes

# Refactor
refactor(audio): extract chord progression logic into dedicated module
refactor(stores): split monolithic session store into focused sub-stores

# Tests
test(audio): add unit tests for pentatonic note mapping
test(typing): add component tests for TypingArea error state

# Docs
docs(contributing): add theme creation guide with TypeScript examples
docs(architecture): document Server vs Client component decision tree

# Chore
chore(deps): upgrade Next.js to 16.1.2
chore(ci): add type checking step to GitHub Actions workflow
```

## Règles

1. **Langue** : descriptions en anglais (codebase internationale)
2. **Longueur** : maximum 72 caractères pour la première ligne
3. **Impératif** : "add feature" pas "added feature" ni "adds feature"
4. **Pas de point final** sur la première ligne
5. **Un commit = une feature complète et testée** — jamais de WIP committé
6. **Breaking changes** : ajouter `BREAKING CHANGE:` dans le footer

## Breaking change

```bash
feat(types)!: rename SessionResult fields to camelCase

BREAKING CHANGE: SessionResult.wpm_net renamed to SessionResult.wpmNet.
Update all consuming code accordingly.

Closes #42
```

## Commits interdits

```bash
# ❌ Ne jamais committer
git commit -m "fix"
git commit -m "WIP"
git commit -m "test"
git commit -m "update"
git commit -m "changes"
git commit -m "misc fixes"

# ✅ Toujours un scope et une description claire
git commit -m "fix(typing): prevent double character registration on fast keypress"
```
