import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  usePathname: () => '/fr/classement',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    user: null,
    isPremium: false,
    loading: false,
    pseudo: '',
  })),
}));

import { GlobalNav } from '../GlobalNav';
import { NavLogo } from '../NavLogo';

// ─── GlobalNav v2 ─────────────────────────────────────────────────────────────

describe('GlobalNav', () => {
  it('affiche le logo NavLogo (lien TypeWav)', () => {
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: /TypeWav/i })).toBeInTheDocument();
  });

  it('affiche les icônes de navigation avec aria-label (leaderboard, premium)', () => {
    render(<GlobalNav />);
    expect(
      screen.getByRole('link', { name: 'leaderboard' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'premium' })).toBeInTheDocument();
  });

  it('affiche le lien connexion si utilisateur non connecté', () => {
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: 'login' })).toBeInTheDocument();
  });

  it('affiche le lien profil (icône ○) si utilisateur connecté', async () => {
    const { useUser } = await import('@/hooks/useUser');
    vi.mocked(useUser).mockReturnValueOnce({
      user: {
        email: 'alice@example.com',
      } as unknown as import('@supabase/supabase-js').User,
      isPremium: false,
      loading: false,
      pseudo: 'Alice',
    });
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: 'profile' })).toBeInTheDocument();
  });

  it('marque le lien actif avec aria-current="page" (pathname=/fr/classement)', () => {
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: 'leaderboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('les liens incluent la locale courante /fr/', () => {
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: 'leaderboard' })).toHaveAttribute(
      'href',
      '/fr/classement',
    );
  });

  it('nav a un fond flottant (backdrop-filter)', () => {
    render(<GlobalNav />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveStyle({ backdropFilter: 'blur(8px)' });
  });
});

// ─── NavLogo ──────────────────────────────────────────────────────────────────

describe('NavLogo', () => {
  it('contient un lien vers /{locale}/', () => {
    render(<NavLogo locale="fr" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/fr');
  });

  it('affiche le texte TypeWav', () => {
    render(<NavLogo locale="fr" />);
    expect(screen.getByText(/TypeWav/)).toBeInTheDocument();
  });

  it('affiche le curseur clignotant par défaut', () => {
    render(<NavLogo locale="fr" />);
    const cursor = document.querySelector('.cursor-blink');
    expect(cursor).toBeInTheDocument();
  });

  it('masque le curseur si showCursor=false', () => {
    render(<NavLogo locale="fr" showCursor={false} />);
    const cursor = document.querySelector('.cursor-blink');
    expect(cursor).not.toBeInTheDocument();
  });

  it('le texte TypeWav utilise --font-display', () => {
    render(<NavLogo locale="fr" />);
    const textSpan = screen.getByText(/TypeWav/);
    expect(textSpan).toHaveStyle({ fontFamily: 'var(--font-display)' });
  });
});
