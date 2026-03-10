import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GlobalNav } from '../GlobalNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/fr/profil',
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
  useUser: vi.fn(() => ({ user: null, isPremium: false, loading: false })),
}));

describe('GlobalNav', () => {
  it('affiche le logo TypeWav avec lien vers /[locale]/', () => {
    render(<GlobalNav />);
    const logo = screen.getByText('TypeWav');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/fr');
  });

  it('affiche les liens Profil, Classement, Premium', () => {
    render(<GlobalNav />);
    expect(screen.getByText('profile')).toBeInTheDocument();
    expect(screen.getByText('leaderboard')).toBeInTheDocument();
    expect(screen.getByText('premium')).toBeInTheDocument();
  });

  it('affiche "Connexion" si utilisateur non connecté', () => {
    render(<GlobalNav />);
    expect(screen.getByText('login')).toBeInTheDocument();
  });

  it('affiche le pseudo si utilisateur connecté', async () => {
    const { useUser } = await import('@/hooks/useUser');
    vi.mocked(useUser).mockReturnValueOnce({
      user: { email: 'alice@example.com' } as any,
      isPremium: false,
      loading: false,
    });
    render(<GlobalNav />);
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('marque le lien actif avec aria-current="page"', () => {
    render(<GlobalNav />);
    const profilLink = screen.getByText('profile').closest('a');
    expect(profilLink).toHaveAttribute('aria-current', 'page');
  });

  it('les liens incluent la locale courante', () => {
    render(<GlobalNav />);
    const profilLink = screen.getByText('profile').closest('a');
    expect(profilLink).toHaveAttribute('href', '/fr/profil');
    const classementLink = screen.getByText('leaderboard').closest('a');
    expect(classementLink).toHaveAttribute('href', '/fr/classement');
  });
});
