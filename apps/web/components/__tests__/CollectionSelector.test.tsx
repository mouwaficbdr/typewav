import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    if (namespace === 'typing.collection') {
      const labels: Record<string, string> = {
        litterature: 'Littérature',
        poesie: 'Poésie',
        philosophie: 'Philosophie',
        gaming: 'Gaming',
        code: 'Code',
      };
      return labels[key] ?? key;
    }
    return key;
  },
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    span: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <span {...props}>{children}</span>,
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

import { DEFAULT_CONFIG, useConfigStore } from '@/stores/useConfigStore';
import { CollectionSelector } from '../typing/CollectionSelector';

beforeEach(async () => {
  await act(async () => {
    await useConfigStore.persist.rehydrate();
  });
});

afterEach(async () => {
  await act(async () => {
    useConfigStore.setState(DEFAULT_CONFIG);
  });
});

describe('CollectionSelector', () => {
  it("ne s'affiche pas en mode apprentissage", () => {
    useConfigStore.setState({ activeMode: 'learning' });
    const { container } = render(<CollectionSelector />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche le nom de la collection active (littérature par défaut)', () => {
    render(<CollectionSelector />);
    expect(screen.getByText('Littérature')).toBeInTheDocument();
  });

  it('ouvre le menu et liste les 5 collections au clic', () => {
    render(<CollectionSelector />);
    fireEvent.click(screen.getByTitle('changeCollection'));

    expect(screen.getByText('Poésie')).toBeInTheDocument();
    expect(screen.getByText('Philosophie')).toBeInTheDocument();
    expect(screen.getByText('Gaming')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
  });

  it('sélectionner une collection met à jour le store et ferme le menu', () => {
    render(<CollectionSelector />);
    fireEvent.click(screen.getByTitle('changeCollection'));
    fireEvent.click(screen.getByText('Code'));

    expect(useConfigStore.getState().activeCollection).toBe('code');
    expect(screen.queryByText('Poésie')).not.toBeInTheDocument();
  });

  it('reste masqué en mode fantôme (texte de session rejoué, pas de collection)', () => {
    useConfigStore.setState({ activeMode: 'ghost' });
    const { container } = render(<CollectionSelector />);
    expect(container).toBeEmptyDOMElement();
  });

  it("reste masqué en mode Code — la collection ne doit jamais pouvoir dériver de 'code'", () => {
    useConfigStore.setState({ activeMode: 'code' });
    const { container } = render(<CollectionSelector />);
    expect(container).toBeEmptyDOMElement();
  });

  it("n'offre ni Code ni Gaming parmi les options en mode Citation (aucune vraie attribution auteur/œuvre)", () => {
    useConfigStore.setState({ activeMode: 'quote' });
    render(<CollectionSelector />);
    fireEvent.click(screen.getByTitle('changeCollection'));

    expect(screen.getByText('Poésie')).toBeInTheDocument();
    expect(screen.getByText('Philosophie')).toBeInTheDocument();
    expect(screen.queryByText('Gaming')).not.toBeInTheDocument();
    expect(screen.queryByText('Code')).not.toBeInTheDocument();
  });

  it('controlsMode prend le pas sur le mode actif du store pour la visibilité', () => {
    // Fantôme sans donnée personnelle se comporte comme Classic (voir
    // HomeClient) : le sélecteur doit rester visible dans ce cas, malgré le
    // mode brut 'ghost' toujours affiché comme actif dans la ConfigBar.
    useConfigStore.setState({ activeMode: 'ghost' });
    render(<CollectionSelector controlsMode="classic" />);
    expect(screen.getByText('Littérature')).toBeInTheDocument();
  });
});
