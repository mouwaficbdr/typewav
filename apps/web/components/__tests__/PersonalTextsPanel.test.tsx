import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    if (namespace === 'typing.personalTexts') {
      const labels: Record<string, string> = {
        title: 'Mes textes',
        empty: 'Aucun texte pour l’instant.',
        addPlaceholder: 'Collez ou écrivez votre texte ici…',
        add: 'Ajouter',
        use: 'Utiliser',
        delete: 'Supprimer',
        close: 'Fermer',
      };
      return labels[key] ?? key;
    }
    return key;
  },
}));

const mockSavePersonalText = vi.fn();
const mockDeletePersonalText = vi.fn();

vi.mock('@/lib/db', () => ({
  savePersonalText: (...args: unknown[]) => mockSavePersonalText(...args),
  deletePersonalText: (...args: unknown[]) => mockDeletePersonalText(...args),
}));

import { useCustomTextStore } from '@/stores/useCustomTextStore';
import { PersonalTextsPanel } from '../typing/PersonalTextsPanel';

const SAMPLE_TEXTS = [
  {
    id: 'text-1',
    title: 'Premier texte',
    content: 'Contenu du premier texte personnel.',
    createdAt: 1000,
    lastUsed: 1000,
    isFavorite: false,
  },
  {
    id: 'text-2',
    title: 'Second texte',
    content: 'Contenu du second texte personnel.',
    createdAt: 2000,
    lastUsed: 2000,
    isFavorite: false,
  },
];

beforeEach(() => {
  mockSavePersonalText.mockReset().mockResolvedValue(undefined);
  mockDeletePersonalText.mockReset().mockResolvedValue(undefined);
  useCustomTextStore.setState({ activePersonalTextId: null });
});

afterEach(() => {
  useCustomTextStore.setState({ activePersonalTextId: null });
});

describe('PersonalTextsPanel', () => {
  it("ne rend rien quand isOpen est false", () => {
    const { container } = render(
      <PersonalTextsPanel
        isOpen={false}
        onClose={vi.fn()}
        personalTexts={[]}
        onChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche l'état vide explicite quand aucun texte n'existe", () => {
    render(
      <PersonalTextsPanel
        isOpen={true}
        onClose={vi.fn()}
        personalTexts={[]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Aucun texte pour l’instant/)).toBeInTheDocument();
  });

  it('liste les textes personnels existants', () => {
    render(
      <PersonalTextsPanel
        isOpen={true}
        onClose={vi.fn()}
        personalTexts={SAMPLE_TEXTS}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Premier texte')).toBeInTheDocument();
    expect(screen.getByText('Second texte')).toBeInTheDocument();
  });

  it('cliquer "Utiliser" sélectionne le texte et ferme le panneau', () => {
    const onClose = vi.fn();
    render(
      <PersonalTextsPanel
        isOpen={true}
        onClose={onClose}
        personalTexts={SAMPLE_TEXTS}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByText('Utiliser')[0]!);

    expect(useCustomTextStore.getState().activePersonalTextId).toBe('text-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('cliquer "Supprimer" appelle deletePersonalText et onChange', async () => {
    const onChange = vi.fn();
    render(
      <PersonalTextsPanel
        isOpen={true}
        onClose={vi.fn()}
        personalTexts={SAMPLE_TEXTS}
        onChange={onChange}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getAllByText('Supprimer')[0]!);
    });

    expect(mockDeletePersonalText).toHaveBeenCalledWith('text-1');
    expect(onChange).toHaveBeenCalled();
  });

  it('ajouter un texte via le formulaire appelle savePersonalText et vide le champ', async () => {
    const onChange = vi.fn();
    render(
      <PersonalTextsPanel
        isOpen={true}
        onClose={vi.fn()}
        personalTexts={[]}
        onChange={onChange}
      />,
    );

    const textarea = screen.getByPlaceholderText(
      'Collez ou écrivez votre texte ici…',
    );
    fireEvent.change(textarea, { target: { value: 'Un nouveau texte.' } });
    await act(async () => {
      fireEvent.click(screen.getByText('Ajouter'));
    });

    expect(mockSavePersonalText).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Un nouveau texte.' }),
    );
    expect(onChange).toHaveBeenCalled();
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it("n'ajoute pas un texte vide (bouton désactivé)", () => {
    render(
      <PersonalTextsPanel
        isOpen={true}
        onClose={vi.fn()}
        personalTexts={[]}
        onChange={vi.fn()}
      />,
    );
    const addButton = screen.getByText('Ajouter');
    expect(addButton).toBeDisabled();
  });

  it('Échap ferme le panneau', () => {
    const onClose = vi.fn();
    render(
      <PersonalTextsPanel
        isOpen={true}
        onClose={onClose}
        personalTexts={[]}
        onChange={vi.fn()}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('cliquer le bouton fermer ferme le panneau', () => {
    const onClose = vi.fn();
    render(
      <PersonalTextsPanel
        isOpen={true}
        onClose={onClose}
        personalTexts={[]}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Fermer'));
    expect(onClose).toHaveBeenCalled();
  });
});
