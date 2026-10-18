import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();

beforeEach(() => {
  mockPush.mockClear();
});

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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

import { ComingSoonClient } from '../ComingSoonClient';

describe('ComingSoonClient', () => {
  it('une seule action principale : le lien « En attendant, joue » vers /fr', () => {
    render(<ComingSoonClient />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/fr');
    expect(links[0]).toHaveTextContent('cta');
  });

  it('le titre est la phrase de tête', () => {
    render(<ComingSoonClient />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'title' }),
    ).toBeInTheDocument();
  });

  it('les trois promesses sont dans une liste ordonnée', () => {
    render(<ComingSoonClient />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('promise1');
    expect(items[1]).toHaveTextContent('promise2');
    expect(items[2]).toHaveTextContent('promise3');
  });

  it('Entrée suit le lien vers /fr', () => {
    render(<ComingSoonClient />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/fr');
  });

  it("n'appelle pas push si le focus est déjà sur un élément interactif", () => {
    render(<ComingSoonClient />);
    const link = screen.getByRole('link');
    link.focus();
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
