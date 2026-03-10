# Spec 16 — Gate Cloud Sync (Coming Soon)

> **Priorité : 🔴 CRITIQUE #4**
> **Effort estimé : 2 fichiers**
> **Commit cible : `fix(sync): display coming-soon state for cloud sync on premium page`**

---

## Contexte et problème

### Situation actuelle

- **Stripe checkout est live** : `POST /api/stripe/checkout` crée une session Stripe réelle
- **sync.ts est écrit et testé** (115 tests passent) mais n'est pas confirmé opérationnel en production
- **Les tables Supabase** (`user_sessions`) ne sont pas confirmées créées en production
- **La feature principale du plan Premium** est la sync cloud cross-device

### Conséquence

Un utilisateur peut payer €4.99/mois via Stripe, obtenir le statut `is_premium = true` dans Supabase, et constater que ses sessions **ne se synchronisent pas** entre ses appareils.

**Exposition légale** (pratique commerciale trompeuse EU), **risque de chargeback**, **perte de confiance** irréversible.

---

## Objectif

Gater la feature sync cloud avec un état "Bientôt disponible" visible et honnête sur la page premium, sans désactiver le checkout Stripe pour les packs sonores premium (qui, eux, fonctionnent).

---

## Stratégie

**Ne pas désactiver le Premium entièrement.** Les packs sonores Cinematic, Phonk, Jazz Piano fonctionnent et sont livrables. Seule la sync cloud est indisponible.

**Approche** :

1. Dans la page Premium, ajouter un badge "Bientôt disponible" à côté de la feature "Sync cloud"
2. Ajouter un `<SyncComingSoonBanner>` en haut de la page profil si l'utilisateur est premium (leur expliquer que la sync arrive)
3. Conserver le checkout Stripe actif (les packs sonores sont fonctionnels)

**Désactiver plus tard** ce gate en retirant `isSyncComingSoon` une fois la sync validée en prod.

---

## Fichiers à modifier

```
# Modifier
apps/web/app/[locale]/premium/PremiumPageClient.tsx    ← badge "bientôt" sur sync
apps/web/app/[locale]/profil/ProfilClient.tsx           ← banner info sync si premium

# Modifier (i18n)
apps/web/messages/fr.json    ← clés sync.comingSoon, sync.comingSoonExplainer
apps/web/messages/en.json
```

---

## Tests à écrire (TDD — RED avant GREEN)

```typescript
describe('PremiumPageClient — sync coming soon', () => {
  it('affiche un badge "Bientôt disponible" à côté de la feature sync', () => {
    // Render PremiumPageClient
    // Badge visible avec le texte attendu
  });

  it('le checkout Stripe reste accessible (non désactivé)', () => {
    // Le bouton "S'abonner" doit toujours être cliquable
  });
});

describe('ProfilClient — sync banner', () => {
  it('affiche un banner info sync si utilisateur premium', () => {
    // isPremium=true → banner visible
  });

  it("n'affiche pas de banner sync si utilisateur gratuit", () => {
    // isPremium=false → pas de banner
  });
});
```

---

## Implémentation

### Étape 1 — `PremiumPageClient.tsx`

Dans la liste des features premium, trouver l'item "Sync cross-device" et ajouter un badge.

La constante à ajouter en haut du fichier :

```typescript
// À retirer une fois la sync validée en production
const SYNC_IS_COMING_SOON = true;
```

Dans le rendu de la feature sync cloud, ajouter conditionnellement :

```tsx
{
  /* Feature sync cloud */
}
<li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <span>Sync cloud cross-device</span>
  {SYNC_IS_COMING_SOON && (
    <span
      style={{
        backgroundColor: 'var(--color-border)',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.6875rem',
        fontWeight: '600',
        letterSpacing: '0.08em',
        padding: '2px 8px',
        borderRadius: '12px',
        textTransform: 'uppercase',
      }}
    >
      {t('sync.comingSoon')}
    </span>
  )}
</li>;
```

Ajouter une note explicative sous la liste des features (avant le bouton de checkout) :

```tsx
{
  SYNC_IS_COMING_SOON && (
    <p
      style={{
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        lineHeight: '1.6',
        padding: '12px 16px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        marginBottom: '16px',
      }}
    >
      {t('sync.comingSoonExplainer')}
    </p>
  );
}
```

### Étape 2 — `ProfilClient.tsx`

Après `const { user, isPremium } = useUser();`, afficher un banner informatif si premium :

```tsx
{
  isPremium && SYNC_IS_COMING_SOON && (
    <div
      role="status"
      aria-live="polite"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '12px 16px',
        marginBottom: '24px',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        color: 'var(--color-text-muted)',
        lineHeight: '1.6',
      }}
    >
      {t('sync.premiumBanner')}
    </div>
  );
}
```

Importer la même constante `SYNC_IS_COMING_SOON = true` dans ce fichier (ou l'exporter depuis un fichier `lib/featureFlags.ts`).

**Recommandation** : créer `apps/web/lib/featureFlags.ts` pour centraliser :

```typescript
/**
 * Feature flags — retirer la constante et ses usages une fois la feature en prod.
 */
export const SYNC_IS_COMING_SOON = true;
```

### Étape 3 — Clés i18n

**`fr.json`** — ajouter le namespace `sync` :

```json
"sync": {
  "comingSoon": "Bientôt",
  "comingSoonExplainer": "La synchronisation cloud cross-device est en cours de déploiement. Elle sera disponible très prochainement pour tous les abonnés Premium. Les packs sonores premium sont disponibles dès maintenant.",
  "premiumBanner": "La sync cloud cross-device sera bientôt disponible. Tes sessions sont actuellement sauvegardées localement. Tu seras notifié dès l'activation."
}
```

**`en.json`** — ajouter le namespace `sync` :

```json
"sync": {
  "comingSoon": "Coming soon",
  "comingSoonExplainer": "Cross-device cloud sync is currently being deployed. It will be available very soon for all Premium subscribers. Premium sound packs are available right now.",
  "premiumBanner": "Cross-device cloud sync is coming soon. Your sessions are currently saved locally. You'll be notified when it's live."
}
```

---

## Retrait du gate (procédure future)

Quand la sync cloud est opérationnelle en production :

1. Valider que `user_sessions` et `user_premium` tables Supabase existent et fonctionnent
2. Valider que `useSyncCloud` synchronise correctement sur 2 appareils réels
3. Dans `lib/featureFlags.ts` : passer `SYNC_IS_COMING_SOON = false`
4. Run `pnpm test && pnpm build`
5. Commit : `feat(sync): enable cloud sync — remove coming-soon gate`

---

## Validation — Checklist d'acceptance

- [ ] `pnpm typecheck` : 0 erreur
- [ ] `pnpm test` : tous les tests passent
- [ ] Page premium : badge "Bientôt" visible à côté de "Sync cloud"
- [ ] Page premium : note explicative visible avant le bouton de checkout
- [ ] Le bouton checkout Stripe est toujours accessible (packs sonores fonctionnels)
- [ ] Page profil (utilisateur premium) : banner informatif sync visible
- [ ] Page profil (utilisateur gratuit) : aucun banner sync
- [ ] `pnpm build` : 0 erreur

---

## Commit

```
fix(sync): display coming-soon state for cloud sync on premium page

Cloud sync (sync.ts) is implemented and tested but not yet validated
in production (Supabase schema not confirmed). Users could pay for
a feature that silently doesn't work.

Adds SYNC_IS_COMING_SOON feature flag (lib/featureFlags.ts).
Adds "coming soon" badge on sync feature in premium page.
Adds informational banner on profile page for premium users.
Checkout remains accessible (premium sound packs are working).
```
