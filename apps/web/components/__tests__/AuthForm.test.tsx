import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

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
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button'));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/fr');
    });
  });

  it('redirige vers /${locale} après connexion réussie (locale en)', async () => {
    vi.mocked(useLocale).mockReturnValue('en');
    const user = userEvent.setup();

    render(<AuthForm mode="login" />);
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Mot de passe'), 'password123');
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
