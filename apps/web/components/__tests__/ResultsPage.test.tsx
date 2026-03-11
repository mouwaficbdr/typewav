import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
      exit?: unknown;
    }) => <div {...props}>{children}</div>,
    h1: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLHeadingElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => <h1 {...props}>{children}</h1>,
  },
  useReducedMotion: () => true,
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

import { ResultsPage } from '../typing/ResultsPage';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResultsPage — record et CTAs', () => {
  it('affiche la bannière "nouveau record" quand isNewWpmRecord=true', () => {
    render(
      <ResultsPage
        wpm={90}
        wpmNet={85}
        accuracy={98}
        consistency={88}
        recommendation=""
        isNewWpmRecord={true}
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it("n'affiche pas la bannière record quand isNewWpmRecord=false", () => {
    render(
      <ResultsPage
        wpm={50}
        wpmNet={47}
        accuracy={95}
        consistency={80}
        recommendation=""
        isNewWpmRecord={false}
      />,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('StatCard : label précède la valeur dans le DOM', () => {
    render(
      <ResultsPage
        wpm={75}
        wpmNet={70}
        accuracy={97}
        consistency={85}
        recommendation=""
      />,
    );
    // Le label "wpmGross" (clé i18n mockée) doit apparaître dans le DOM
    const allText = document.body.textContent ?? '';
    const wpmGrossIndex = allText.indexOf('wpmGross');
    const value75Index = allText.indexOf('75');
    // label avant valeur
    expect(wpmGrossIndex).toBeLessThan(value75Index);
  });

  it('affiche le lien profil dans les CTAs', () => {
    render(
      <ResultsPage
        wpm={75}
        wpmNet={70}
        accuracy={97}
        consistency={85}
        recommendation=""
      />,
    );
    // Le CTA "profil" doit être présent — clé mock retourne 'title' (profile.title)
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href')?.includes('profil'))).toBe(
      true,
    );
  });

  it('affiche le lien "tryAgain" principal', () => {
    render(
      <ResultsPage
        wpm={75}
        wpmNet={70}
        accuracy={97}
        consistency={85}
        recommendation=""
      />,
    );
    expect(screen.getByText('tryAgain')).toBeInTheDocument();
  });
});
