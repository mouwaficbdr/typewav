import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
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
import { ContextSelectors } from '../typing/ContextSelectors';

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

describe('ContextSelectors', () => {
  it("ne s'affiche pas en mode apprentissage", () => {
    useConfigStore.setState({ activeMode: 'learning' });
    const { container } = render(<ContextSelectors />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reste masqué en mode fantôme (texte de session rejoué, pas de langue à choisir)', () => {
    useConfigStore.setState({ activeMode: 'ghost' });
    const { container } = render(<ContextSelectors />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reste masqué en mode Libre (texte personnel, jamais filtré)', () => {
    useConfigStore.setState({ activeMode: 'custom' });
    const { container } = render(<ContextSelectors />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reste masqué en mode Code', () => {
    useConfigStore.setState({ activeMode: 'code' });
    const { container } = render(<ContextSelectors />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche la langue active en mode classic', () => {
    render(<ContextSelectors />); // activeMode = 'classic' par défaut
    expect(screen.getByTitle('changeLanguage')).toBeInTheDocument();
  });

  it('ouvre le menu et sélectionner une langue met à jour le store', () => {
    render(<ContextSelectors />);
    fireEvent.click(screen.getByTitle('changeLanguage'));
    // Le mock next-intl renvoie la clé : 'langEn' pour t('langEn').
    fireEvent.click(screen.getByText('langEn'));

    expect(useConfigStore.getState().textLanguage).toBe('en');
  });

  it('controlsMode prend le pas sur le mode actif du store pour la visibilité', () => {
    // Fantôme sans donnée personnelle se comporte comme Classic (voir
    // HomeClient) : le sélecteur de langue doit rester visible dans ce cas,
    // malgré le mode brut 'ghost' toujours affiché comme actif.
    useConfigStore.setState({ activeMode: 'ghost' });
    render(<ContextSelectors controlsMode="classic" />);
    expect(screen.getByTitle('changeLanguage')).toBeInTheDocument();
  });
});
