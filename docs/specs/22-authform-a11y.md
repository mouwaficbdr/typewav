# Spec 22 — AuthForm : Accessibilité critique (WCAG 2.1 AA / RGAA)

> **Créé le : 10 Mars 2026**
> **Sévérité : CRITIQUE — légal (RGAA obligatoire en France)**
> **Spec parente : `docs/specs/11-refonte-audit-2026.md` — item #19**

---

## Problèmes identifiés

### 1. Absence de `<label>` sur les inputs (WCAG 1.3.1 — Échec)

`AuthForm.tsx` n'utilise que l'attribut `placeholder` pour identifier les champs email/password.
Les `placeholder` disparaissent dès que l'utilisateur commence à saisir.
Les lecteurs d'écran annoncent "Champ de saisie" sans contexte.

RGAA 11.1 exige un label explicite sur tout champ de formulaire.

### 2. Suppression du focus ring via `outline: 'none'` (WCAG 2.4.7 — Échec)

```tsx
// apps/web/components/ui/AuthForm.tsx — ACTUEL (BUG)
const inputStyle: React.CSSProperties = {
  outline: 'none',   // ← Tue la navigation clavier sur fond noir
  border: '1px solid var(--color-border)',
  ...
};
```

`globals.css` définit correctement `:focus-visible { outline: 2px solid var(--color-accent); }`
mais l'`outline: none` inline overrides ce style pour TOUS les événements focus, y compris clavier.

### 3. Border de champ invisible — contraste 1.3:1 (WCAG 1.4.11 — Échec)

`var(--color-border)` = `#1A1A2E` sur `var(--color-surface)` = `#0A0A0A`.
Ratio de contraste : **1.3:1**. Minimum requis pour les composants UI : **3:1**.
Les champs de saisie n'ont aucune délimitation visuelle perceptible.

---

## Solution

### Fichiers à modifier

- `apps/web/components/ui/AuthForm.tsx`
- `apps/web/styles/globals.css` (ajouter `.sr-only` si absent)

### Changement 1 — Ajouter les labels `sr-only`

Ajouter `htmlFor` sur chaque `<input>` + un `<label className="sr-only">`.

```tsx
// AVANT
<input
  type="email"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  autoComplete="email"
  style={inputStyle}
/>

// APRÈS
<label htmlFor="auth-email" className="sr-only">
  {t('emailLabel')}
</label>
<input
  id="auth-email"
  type="email"
  placeholder={t('emailPlaceholder')}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  autoComplete="email"
  style={inputStyle}
/>
```

Même chose pour le champ password avec `id="auth-password"`.

### Changement 2 — Supprimer `outline: 'none'`, ajouter focus via CSS

```tsx
// APRÈS — inputStyle dans AuthForm.tsx
const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-text-muted)', // ← contraste 5.7:1 ✅
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.875rem',
  padding: '10px 14px',
  width: '100%',
  transition: 'border-color var(--transition-fast)',
  // PAS d'outline: 'none' — laisser :focus-visible CSS agir
};
```

La classe CSS globale `.typing-focus-ring:focus-visible` (déjà dans `globals.css`) utilise
`box-shadow` - l'appliquer également aux inputs de formulaire via une nouvelle classe :

```css
/* apps/web/styles/globals.css — AJOUTER */
.form-input:focus-visible {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent);
}
```

Ajouter `className="form-input"` sur chaque `<input>` dans `AuthForm.tsx`.

### Changement 3 — Ajouter `.sr-only` dans globals.css si absent

```css
/* apps/web/styles/globals.css — AJOUTER si absent */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Changement 4 — Clés i18n nécessaires

Ajouter dans `messages/fr.json` et `messages/en.json`, namespace `"auth"` :

```json
{
  "auth": {
    "emailLabel": "Adresse email",
    "emailPlaceholder": "Email",
    "passwordLabel": "Mot de passe",
    "passwordPlaceholder": "Mot de passe",
    ...existantes
  }
}
```

---

## Tests requis

Fichier : `apps/web/components/__tests__/AuthForm.test.tsx`

```typescript
describe('AuthForm — accessibilité', () => {
  it('mode login : le label "email" est dans le DOM et associé à l'input', () => {
    render(<AuthForm mode="login" />)
    const input = screen.getByLabelText(/email/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'email')
  })

  it('mode login : le label "mot de passe" est dans le DOM et associé à l'input', () => {
    render(<AuthForm mode="login" />)
    const input = screen.getByLabelText(/mot de passe/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('mode signup : les deux labels sont présents', () => {
    render(<AuthForm mode="signup" />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
  })

  it("les inputs n'ont pas d'attribut style outline:none", () => {
    render(<AuthForm mode="login" />)
    const input = screen.getByLabelText(/email/i) as HTMLInputElement
    // L'outline doit venir du CSS, pas être supprimé inline
    expect(input.style.outline).not.toBe('none')
  })

  it('les inputs ont la classe form-input pour le focus ring CSS', () => {
    render(<AuthForm mode="login" />)
    expect(screen.getByLabelText(/email/i)).toHaveClass('form-input')
    expect(screen.getByLabelText(/mot de passe/i)).toHaveClass('form-input')
  })
})
```

---

## Workflow

```
1. Ajouter .sr-only dans globals.css
2. Ajouter .form-input:focus-visible dans globals.css
3. Ajouter les clés auth.emailLabel, auth.emailPlaceholder, auth.passwordLabel,
   auth.passwordPlaceholder dans fr.json et en.json
4. Modifier AuthForm.tsx (labels, inputStyle, className)
5. Écrire les tests RED
6. Implémenter GREEN
7. pnpm typecheck && pnpm lint && pnpm test && pnpm build ← BLOQUANT
8. Commit : fix(a11y): add labels and restore focus ring in AuthForm
```

## Commit

```
fix(a11y): add visible labels and focus ring to AuthForm inputs

- Add sr-only <label> elements for email and password inputs
- Remove inline outline:none that blocked keyboard navigation
- Set input border to --color-text-muted (5.7:1 contrast, WCAG AA)
- Add .form-input CSS class with focus-visible ring via color-mix
- Add .sr-only utility class to globals.css
- Add auth.emailLabel / passwordLabel i18n keys (fr + en)

Fixes WCAG 1.3.1, 2.4.7, 1.4.11 — RGAA 11.1 compliance
```
