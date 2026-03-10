# Spec 14 — Fix Auth : Locale Redirect + Reset Password

> **Priorité : 🔴 CRITIQUE #3 (redirect) + 🟠 HAUTE #6 (reset password)**
> **Effort estimé : 3 fichiers (redirect) + 2 fichiers (reset password)**
> **Commits cibles :**
>
> - `fix(auth): use current locale in post-login redirect`
> - `feat(auth): add password reset page and forgot-password link`

---

## Problème 1 — Redirect post-login ignore la locale

### Situation actuelle

Dans `apps/web/components/ui/AuthForm.tsx` :

```typescript
// AVANT — BUG
router.push('/');
router.refresh();
```

L'application route entièrement sous `/[locale]/` (fr ou en). Rediriger vers bare `/` bypasse :

- `NextIntlClientProvider` → toutes les traductions sont perdues
- `MilestoneToast` → les jalons ne se déclenchent pas
- Le middleware next-intl peut gérer la redirection, mais c'est un comportement implicite fragile

### Fix

```typescript
// APRÈS — CORRECT
const locale = useLocale(); // de next-intl
router.push(`/${locale}`);
router.refresh();
```

---

## Problème 2 — Absence de reset password

### Situation actuelle

La page `/auth/login` affiche un formulaire email + password sans lien "Mot de passe oublié ?".
Pour un produit avec Stripe checkout actif, c'est un bloquant de confiance.

Supabase Auth supporte nativement `supabase.auth.resetPasswordForEmail()`.

---

## Fichiers à modifier / créer

```
# Fix redirect (modifier)
apps/web/components/ui/AuthForm.tsx

# Reset password (créer)
apps/web/app/[locale]/auth/reset-password/page.tsx
apps/web/app/[locale]/auth/reset-password/ResetPasswordClient.tsx

# Fichiers de messages i18n (modifier)
apps/web/messages/fr.json   ← ajouter clés auth.forgotPassword, auth.resetSent, etc.
apps/web/messages/en.json   ← idem en anglais
```

---

## Tests à écrire (TDD — RED avant GREEN)

### Tests AuthForm — `apps/web/components/__tests__/AuthForm.test.tsx`

```typescript
describe('AuthForm — redirection post-login', () => {
  it('redirige vers /${locale} après connexion réussie (locale fr)', async () => {
    // Mock useLocale() → 'fr'
    // Mock supabase.auth.signInWithPassword → success
    // Vérifier router.push('/fr')
  });

  it('redirige vers /${locale} après connexion réussie (locale en)', async () => {
    // Mock useLocale() → 'en'
    // Vérifier router.push('/en')
  });

  it('affiche un lien "Mot de passe oublié" en mode login', () => {
    // Render AuthForm mode="login"
    // Le lien vers /auth/reset-password doit être présent
  });

  it('le lien reset password pointe vers la route locale correcte', () => {
    // useLocale() → 'fr' → href="/fr/auth/reset-password"
  });
});

describe('ResetPasswordClient', () => {
  it('affiche un formulaire email', () => {});
  it("appelle supabase.auth.resetPasswordForEmail avec l'email", async () => {});
  it('affiche un message de confirmation après envoi', async () => {});
  it("affiche une erreur si l'email est invalide", async () => {});
});
```

---

## Implémentation

### Étape 1 — Fix redirect dans `AuthForm.tsx`

**Importer `useLocale`** depuis `next-intl` :

```typescript
import { useLocale } from 'next-intl';
```

**Dans le composant :**

```typescript
const locale = useLocale();
```

**Dans `handleSubmit`, mode login, remplacer :**

```typescript
// AVANT
router.push('/');
router.refresh();

// APRÈS
router.push(`/${locale}`);
router.refresh();
```

**Ajouter le lien reset password** dans le JSX, après les inputs, avant le bouton :

```tsx
{
  mode === 'login' && (
    <Link
      href={`/${locale}/auth/reset-password`}
      style={{
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8125rem',
        textDecoration: 'none',
        alignSelf: 'flex-end',
      }}
      className="hover:underline"
    >
      {t('forgotPassword')}
    </Link>
  );
}
```

Note : `t` vient de `useTranslations('auth')`. Ajouter également l'import de `Link` depuis `next/link`.

### Étape 2 — Page `reset-password`

**`apps/web/app/[locale]/auth/reset-password/page.tsx`** (Server Component) :

```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordClient } from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe — TypeWav',
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}
```

**`ResetPasswordClient.tsx`** (Client Component — gestion formulaire + Supabase) :

```tsx
'use client';

/**
 * ResetPasswordClient — formulaire de réinitialisation de mot de passe.
 * Client Component justifié : appel Supabase browser client, state de formulaire.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

export function ResetPasswordClient() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError(t('serviceUnavailable'));
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/${locale}/auth/callback?type=recovery`,
      },
    );

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  // Affichage post-envoi
  if (sent) {
    return (
      <main /* styles cohérents avec AuthForm */>
        <p
          style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-ui)' }}
        >
          {t('resetEmailSent')}
        </p>
        <Link href={`/${locale}/auth/login`}>{t('backToLogin')}</Link>
      </main>
    );
  }

  return (
    <main /* styles cohérents avec les pages auth */>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>
        {t('resetPasswordTitle')}
      </h1>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
        />
        {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? t('loading') : t('sendResetEmail')}
        </button>
      </form>
      <Link href={`/${locale}/auth/login`}>{t('backToLogin')}</Link>
    </main>
  );
}
```

Appliquer les mêmes styles CSS inline que `AuthForm.tsx` pour la cohérence visuelle (inputStyle, buttonStyle, couleurs via tokens CSS).

### Étape 3 — Clés i18n

**`apps/web/messages/fr.json`** — ajouter dans le namespace `auth` :

```json
"auth": {
  "forgotPassword": "Mot de passe oublié ?",
  "resetPasswordTitle": "Réinitialiser le mot de passe",
  "sendResetEmail": "Envoyer le lien",
  "resetEmailSent": "Email envoyé ! Vérifiez votre boîte mail.",
  "backToLogin": "← Retour à la connexion",
  "serviceUnavailable": "Service d'authentification non configuré.",
  "emailPlaceholder": "Votre email",
  "loading": "Chargement…"
}
```

**`apps/web/messages/en.json`** — ajouter dans le namespace `auth` :

```json
"auth": {
  "forgotPassword": "Forgot password?",
  "resetPasswordTitle": "Reset your password",
  "sendResetEmail": "Send reset link",
  "resetEmailSent": "Email sent! Check your inbox.",
  "backToLogin": "← Back to login",
  "serviceUnavailable": "Authentication service is not configured.",
  "emailPlaceholder": "Your email",
  "loading": "Loading…"
}
```

**Important** : Vérifier que le namespace `auth` existe déjà dans les fichiers messages. Si non, le créer. Ne pas supprimer les clés existantes.

---

## Vérification du singleton Supabase client

`getSupabaseBrowserClient()` dans `lib/supabase/client.ts` utilise un singleton module-level `_client`. C'est correct — pas de problème d'infinite loop dans `useUser.ts`. Aucune modification nécessaire.

---

## Validation — Checklist d'acceptance

- [ ] `pnpm typecheck` : 0 erreur
- [ ] `pnpm test` : tous les tests passent
- [ ] Login en locale `fr` → redirect vers `/fr/` (et non `/`)
- [ ] Login en locale `en` → redirect vers `/en/` (et non `/`)
- [ ] Page `/[locale]/auth/login` affiche un lien "Mot de passe oublié ?"
- [ ] Lien pointe vers `/[locale]/auth/reset-password`
- [ ] Page reset password : email valide → message de confirmation
- [ ] Page reset password : email invalide → message d'erreur
- [ ] Les clés i18n sont présentes dans fr.json et en.json
- [ ] `pnpm build` : 0 erreur

---

## Commits

```bash
# Commit 1
fix(auth): use current locale in post-login redirect

router.push('/') was bypassing the NextIntlClientProvider locale layout.
Now uses useLocale() from next-intl to redirect to /${locale}.

# Commit 2
feat(auth): add password reset page and forgot-password link

Adds /auth/reset-password route using supabase.auth.resetPasswordForEmail().
Adds "Mot de passe oublié ?" link on the login form.
Adds i18n keys for auth namespace in fr.json and en.json.
```
