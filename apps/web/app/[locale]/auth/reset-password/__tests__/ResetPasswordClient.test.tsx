import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'fr' }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: vi.fn(() => 'fr'),
}));

const mockResetPassword = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: vi.fn(() => ({
    auth: {
      resetPasswordForEmail: mockResetPassword,
    },
  })),
}));

import { ResetPasswordClient } from '../ResetPasswordClient';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResetPasswordClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResetPassword.mockResolvedValue({ error: null });
  });

  it('affiche le formulaire avec un champ email accessible', () => {
    render(<ResetPasswordClient />);
    const input = screen.getByLabelText('emailLabel');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveClass('form-input');
  });

  it("appelle resetPasswordForEmail avec l'email saisi", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordClient />);

    await user.type(screen.getByLabelText('emailLabel'), 'test@example.com');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/fr/auth/callback'),
        }),
      );
    });
  });

  it('affiche le message de confirmation après envoi réussi', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordClient />);

    await user.type(screen.getByLabelText('emailLabel'), 'test@example.com');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('resetSent')).toBeInTheDocument();
    });
  });

  it("affiche un message d'erreur si resetPasswordForEmail échoue", async () => {
    mockResetPassword.mockResolvedValue({ error: { message: 'boom' } });
    const user = userEvent.setup();
    render(<ResetPasswordClient />);

    await user.type(screen.getByLabelText('emailLabel'), 'test@example.com');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('resetError')).toBeInTheDocument();
    });
  });

  it('le lien "retour" pointe vers la route login locale', () => {
    render(<ResetPasswordClient />);
    const link = screen.getByText('backToLogin').closest('a');
    expect(link).toHaveAttribute('href', '/fr/auth/login');
  });
});
