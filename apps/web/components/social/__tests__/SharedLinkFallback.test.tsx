import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: ComponentProps<'a'>) => (
    <a {...props}>{children}</a>
  ),
}));

import { SharedLinkFallback } from '../SharedLinkFallback';

describe('SharedLinkFallback', () => {
  const base = {
    title: 'Ce défi n’a pas pu se charger',
    detail: 'Le lien est incomplet ou a expiré.',
    ctaHref: '/fr',
    ctaLabel: 'Essayer TypeWav',
  };

  it('présente le titre comme un vrai titre, pas une ligne d’erreur perdue', () => {
    render(<SharedLinkFallback {...base} />);
    expect(
      screen.getByRole('heading', { name: base.title }),
    ).toBeInTheDocument();
  });

  it('explique calmement la cause', () => {
    render(<SharedLinkFallback {...base} />);
    expect(screen.getByText(base.detail)).toBeInTheDocument();
  });

  it('la cause est en gris muté, jamais en rouge d’alarme', () => {
    render(<SharedLinkFallback {...base} />);
    const detail = screen.getByText(base.detail);
    expect(detail).toHaveStyle({ color: 'var(--color-text-muted)' });
    expect(detail).not.toHaveStyle({ color: 'var(--color-error)' });
  });

  it('le CTA mène à la destination fournie et vend le produit', () => {
    render(<SharedLinkFallback {...base} />);
    const cta = screen.getByRole('link', { name: base.ctaLabel });
    expect(cta).toHaveAttribute('href', '/fr');
  });
});
