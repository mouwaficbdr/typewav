import 'fake-indexeddb/auto';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/stores/useAudioStore', () => ({
  useAudioStore: () => ({ soundPackId: 'piano', setSoundPack: vi.fn() }),
}));

import { DEFAULT_CONFIG, useConfigStore } from '@/stores/useConfigStore';

// Storage IndexedDB asynchrone : réhydratation déterministe avant chaque
// test (voir useConfigStore.test.ts pour le détail de la course évitée).
beforeEach(async () => {
  await act(async () => {
    await useConfigStore.persist.rehydrate();
  });
});

// Reset store between tests
afterEach(async () => {
  await act(async () => {
    useConfigStore.setState(DEFAULT_CONFIG);
  });
});

import { ConfigBar } from '../typing/ConfigBar';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ConfigBar', () => {
  it('affiche les modes principaux', () => {
    render(<ConfigBar />);
    expect(screen.getByTitle('classic')).toBeInTheDocument();
    expect(screen.getByTitle('sprint')).toBeInTheDocument();
    expect(screen.getByTitle('code')).toBeInTheDocument();
  });

  it('le mode actif (sprint) a aria-pressed="true"', () => {
    useConfigStore.setState({ activeMode: 'sprint' });
    render(<ConfigBar />);
    expect(screen.getByTitle('sprint')).toHaveAttribute('aria-pressed', 'true');
  });

  it('les modificateurs sont cachés sur les modes sans modificateurs (ghost)', () => {
    useConfigStore.setState({ activeMode: 'ghost' });
    render(<ConfigBar />);
    // t('punctuation') → 'punctuation' (mock), not 'Activer la ponctuation'
    expect(screen.queryByTitle('punctuation')).not.toBeInTheDocument();
  });

  it('les modificateurs sont visibles en mode classic', () => {
    render(<ConfigBar />); // activeMode = 'classic' by default
    expect(screen.getByTitle('punctuation')).toBeInTheDocument();
  });

  it('les modificateurs restent cachés en mode apprentissage (sans effet sur le texte généré)', () => {
    useConfigStore.setState({ activeMode: 'learning' });
    render(<ConfigBar />);
    expect(screen.queryByTitle('punctuation')).not.toBeInTheDocument();
  });

  it('masque les modificateurs quand la collection active est Code, même en mode Citation', () => {
    // La collection Code force ponctuation/chiffres (voir HomeClient) : des
    // bascules qui prétendraient les contrôler mentiraient sur l'état réel.
    useConfigStore.setState({ activeMode: 'quote', activeCollection: 'code' });
    render(<ConfigBar />);
    expect(screen.queryByTitle('punctuation')).not.toBeInTheDocument();
  });

  it('controlsMode prend le pas sur le mode actif du store pour la visibilité', () => {
    // Fantôme sans donnée personnelle se comporte comme Classic (voir
    // HomeClient) : les modificateurs doivent suivre ce comportement réel,
    // pas le mode brut affiché dans la ConfigBar.
    useConfigStore.setState({ activeMode: 'ghost' });
    render(<ConfigBar controlsMode="classic" />);
    expect(screen.getByTitle('punctuation')).toBeInTheDocument();
  });

  it('n’affiche pas de chips collection en mode classic', () => {
    render(<ConfigBar />);
    expect(screen.queryByRole('button', { name: /litterature/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /poesie/i })).toBeNull();
  });

  it('affiche les durées en mode classic (ligne 2)', () => {
    render(<ConfigBar />);
    expect(screen.getByRole('button', { name: '30' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '60' })).toBeInTheDocument();
  });

  it('affiche les word counts en mode sprint (ligne 2)', () => {
    useConfigStore.setState({ activeMode: 'sprint' });
    render(<ConfigBar />);
    expect(screen.getByRole('button', { name: '25' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '50' })).toBeInTheDocument();
  });

  it('le chip Zen inactif ne porte plus de traitement à part (retrait du signature/A6)', () => {
    // Nouveau modèle MonkeyType : plus aucun chip n'a de fond au repos, Zen
    // y compris. S'il portait encore un fond ou une teinte permanente, ce
    // serait justement le souci que A6 avait corrigé, sous une autre forme.
    render(<ConfigBar />); // activeMode = 'classic' par défaut, Zen inactif
    const zenChip = screen.getByTitle('zen');
    const otherInactiveChip = screen.getByTitle('sprint');
    expect(zenChip.style.background).toBe('transparent');
    expect(zenChip.style.color).toBe(otherInactiveChip.style.color);
  });

  it('la sélection ne change que la couleur : jamais de fond sur le chip actif', () => {
    useConfigStore.setState({ activeMode: 'classic' });
    const { rerender } = render(<ConfigBar />);
    const inactiveBackground = screen.getByTitle('zen').style.background;
    const inactiveColor = screen.getByTitle('zen').style.color;

    act(() => {
      useConfigStore.setState({ activeMode: 'zen' });
    });
    rerender(<ConfigBar />);
    const activeChip = screen.getByTitle('zen');
    // Le fond reste transparent, actif ou non : seule la couleur bouge.
    expect(activeChip.style.background).toBe('transparent');
    expect(activeChip.style.background).toBe(inactiveBackground);
    expect(activeChip.style.color).not.toBe(inactiveColor);
    expect(activeChip.style.color).toBe('var(--color-accent)');
  });

  it('même modèle de sélection sur les options contextuelles (durées) : couleur seule', () => {
    useConfigStore.setState({ activeMode: 'classic', durationSeconds: 30 });
    render(<ConfigBar />);
    const active = screen.getByRole('button', { name: '30' });
    const inactive = screen.getByRole('button', { name: '60' });
    expect(active.style.background).toBe('transparent');
    expect(inactive.style.background).toBe('transparent');
    expect(active.style.color).toBe('var(--color-accent)');
    expect(inactive.style.color).toBe('var(--color-text-muted)');
  });

  it('a un role toolbar avec aria-label', () => {
    render(<ConfigBar />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeInTheDocument();
    // t('label') → 'label' via mock
    expect(toolbar).toHaveAttribute('aria-label', 'label');
  });

  it('regroupe les chips en trois groupes ARIA distincts', () => {
    render(<ConfigBar />); // classic : modificateurs + modes + options, les 3 groupes
    const groups = screen.getAllByRole('group');
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual([
      'modifiersGroup',
      'modesGroup',
      'optionsGroup',
    ]);
  });

  it('un groupe sans contenu (options hors classic/sprint) est entièrement omis', () => {
    useConfigStore.setState({ activeMode: 'quote' });
    render(<ConfigBar />);
    const groups = screen.getAllByRole('group');
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual([
      'modifiersGroup',
      'modesGroup',
    ]);
  });
});
