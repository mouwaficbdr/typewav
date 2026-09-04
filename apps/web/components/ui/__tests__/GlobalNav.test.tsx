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

import { GlobalNav } from '../GlobalNav';
import { NavLogo } from '../NavLogo';

// ─── GlobalNav (v1, sans comptes) ─────────────────────────────────────────────

describe('GlobalNav', () => {
  it('affiche le logo NavLogo (lien TypeWav)', () => {
    render(<GlobalNav />);
    expect(screen.getByRole('link', { name: /TypeWav/i })).toBeInTheDocument();
  });

  it('affiche les cinq entrées de navigation', () => {
    render(<GlobalNav />);
    for (const name of [
      'typing',
      'leaderboard',
      'profile',
      'settings',
      'about',
    ]) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
  });

  it("n'expose ni connexion ni premium", () => {
    render(<GlobalNav />);
    expect(screen.queryByRole('link', { name: 'login' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'premium' })).toBeNull();
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
    expect(screen.getByRole('link', { name: 'profile' })).toHaveAttribute(
      'href',
      '/fr/profil',
    );
  });

  it('nav utilise un fond transparent', () => {
    render(<GlobalNav />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveStyle({ background: 'transparent' });
  });
});

// ─── NavLogo ──────────────────────────────────────────────────────────────────

describe('NavLogo', () => {
  it('contient un lien vers /{locale}/', () => {
    render(<NavLogo locale="fr" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/fr');
  });

  it('affiche la signature de marque type/wav', () => {
    render(<NavLogo locale="fr" />);
    expect(screen.getByText('type')).toBeInTheDocument();
    expect(screen.getByText('wav')).toBeInTheDocument();
  });

  it('n’affiche pas de curseur clignotant dans la nouvelle version du logo', () => {
    render(<NavLogo locale="fr" />);
    const cursor = document.querySelector('.cursor-blink');
    expect(cursor).not.toBeInTheDocument();
  });

  it('la partie wav utilise --font-display', () => {
    render(<NavLogo locale="fr" />);
    const textSpan = screen.getByText('wav');
    expect(textSpan).toHaveStyle({ fontFamily: 'var(--font-display)' });
  });
});
