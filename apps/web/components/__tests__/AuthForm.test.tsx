import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'fr' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: vi.fn(() => 'fr'),
}));

vi.mock('motion/react', () => ({
  motion: {
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useReducedMotion: () => false,
}));

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
    },
  })),
}));

import { useLocale } from 'next-intl';
import { AuthForm } from '../ui/AuthForm';

// ─── Tests ────────────────────────────────────────────────────────────────────

// ─── Spec-22 : Accessibilité (WCAG 1.3.1, 2.4.7, 1.4.11 / RGAA 11.1) ────────

describe('AuthForm — accessibilité', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mode login : le champ email possède un label associé', () => {
    render(<AuthForm mode="login" />);
    const input = screen.getByLabelText('emailLabel');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
  });

  it('mode login : le champ password possède un label associé', () => {
    render(<AuthForm mode="login" />);
    const input = screen.getByLabelText('passwordLabel');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('mode signup : les deux labels sont présents', () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByLabelText('emailLabel')).toBeInTheDocument();
    expect(screen.getByLabelText('passwordLabel')).toBeInTheDocument();
  });

  it("les inputs n'ont pas d'attribut style outline:none (focus ring géré par CSS)", () => {
    render(<AuthForm mode="login" />);
    const input = screen.getByLabelText('emailLabel') as HTMLInputElement;
    expect(input.style.outline).not.toBe('none');
  });

  it('les inputs ont la classe form-input pour le focus ring CSS', () => {
    render(<AuthForm mode="login" />);
    expect(screen.getByLabelText('emailLabel')).toHaveClass('form-input');
    expect(screen.getByLabelText('passwordLabel')).toHaveClass('form-input');
  });

  it("une erreur de connexion est annoncée vocalement (role=alert)", async () => {
    // Supabase renvoie une AuthError (sous-classe d'Error) : le composant relaie
    // err.message quand c'est une Error, sinon t('genericError').
    mockSignIn.mockResolvedValue({ error: new Error('Invalid credentials') });
    const user = userEvent.setup();

    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText('emailLabel'), 'test@example.com');
    await user.type(screen.getByLabelText('passwordLabel'), 'password123');
    await user.click(screen.getByRole('button'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid credentials');
  });

  it("le message de succès d'inscription est annoncé (role=status)", async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    render(<AuthForm mode="signup" />);
    await user.type(screen.getByLabelText('emailLabel'), 'new@example.com');
    await user.type(screen.getByLabelText('passwordLabel'), 'password123');
    await user.click(screen.getByRole('button'));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('signupSuccess');
  });
});

// ─── Redirection post-login ───────────────────────────────────────────────────

describe('AuthForm — redirection post-login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
    vi.mocked(useLocale).mockReturnValue('fr');
  });

  it('redirige vers /${locale} après connexion réussie (locale fr)', async () => {
    vi.mocked(useLocale).mockReturnValue('fr');
    const user = userEvent.setup();

    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText('emailLabel'), 'test@example.com');
    await user.type(screen.getByLabelText('passwordLabel'), 'password123');
    await user.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/fr');
    });
  });

  it('redirige vers /${locale} après connexion réussie (locale en)', async () => {
    vi.mocked(useLocale).mockReturnValue('en');
    const user = userEvent.setup();

    render(<AuthForm mode="login" />);
    await user.type(screen.getByLabelText('emailLabel'), 'test@example.com');
    await user.type(screen.getByLabelText('passwordLabel'), 'password123');
    await user.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en');
    });
  });

  it('affiche un lien "Mot de passe oublié" en mode login', () => {
    render(<AuthForm mode="login" />);
    // t('forgotPassword') retourne 'forgotPassword' grâce au mock
    expect(screen.getByText('forgotPassword')).toBeInTheDocument();
  });

  it('le lien reset password pointe vers la route locale correcte', () => {
    vi.mocked(useLocale).mockReturnValue('fr');
    render(<AuthForm mode="login" />);

    const link = screen.getByText('forgotPassword').closest('a');
    expect(link).toHaveAttribute('href', '/fr/auth/reset-password');
  });

  it("n'affiche pas le lien reset password en mode signup", () => {
    render(<AuthForm mode="signup" />);
    expect(screen.queryByText('forgotPassword')).not.toBeInTheDocument();
  });
});
