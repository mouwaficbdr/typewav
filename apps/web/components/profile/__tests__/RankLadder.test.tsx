import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RankTier } from '@typewav/types';
import { RankLadder } from '../RankLadder';

const labels: Record<RankTier, string> = {
  novice: 'Novice',
  apprentice: 'Apprenti',
  operator: 'Opérateur',
  architect: 'Architecte',
  ghost: 'Fantôme',
};

describe('RankLadder', () => {
  it('rend les cinq paliers, du plus haut au plus bas', () => {
    render(
      <RankLadder
        currentRank="novice"
        currentWpm={10}
        labels={labels}
        nextRankText={(l, w, g) => `${l} à ${w} · +${g}`}
        maxedText="Palier maximum"
      />,
    );
    for (const l of Object.values(labels)) {
      expect(screen.getByText(l)).toBeInTheDocument();
    }
  });

  it('marque le palier courant avec aria-current', () => {
    render(
      <RankLadder
        currentRank="operator"
        currentWpm={60}
        labels={labels}
        nextRankText={(l, w, g) => `${l} à ${w} · +${g}`}
        maxedText="Palier maximum"
      />,
    );
    const current = screen.getByText('Opérateur').closest('[aria-current]');
    expect(current).toHaveAttribute('aria-current', 'true');
  });

  it('affiche le prochain palier et l’écart de WPM à combler', () => {
    const nextRankText = vi.fn(
      (l: string, w: number, g: number) => `${l} à ${w} WPM · +${g}`,
    );
    render(
      <RankLadder
        currentRank="operator"
        currentWpm={60}
        labels={labels}
        nextRankText={nextRankText}
        maxedText="Palier maximum"
      />,
    );
    // operator minWpm 51, architect minWpm 71, current 60 -> gap 11
    expect(nextRankText).toHaveBeenCalledWith('Architecte', 71, 11);
    expect(screen.getByText('Architecte à 71 WPM · +11')).toBeInTheDocument();
  });

  it('au palier maximum (ghost) affiche le texte "maximum" et pas de prochain palier', () => {
    const nextRankText = vi.fn(() => 'SHOULD NOT APPEAR');
    render(
      <RankLadder
        currentRank="ghost"
        currentWpm={120}
        labels={labels}
        nextRankText={nextRankText}
        maxedText="Palier maximum atteint"
      />,
    );
    expect(screen.getByText('Palier maximum atteint')).toBeInTheDocument();
    expect(nextRankText).not.toHaveBeenCalled();
  });

  it('la jauge de proximité reflète l’avancée vers le palier suivant', () => {
    render(
      <RankLadder
        currentRank="operator"
        currentWpm={60}
        labels={labels}
        nextRankText={(l, w, g) => `${l} ${w} ${g}`}
        maxedText="max"
      />,
    );
    // operator 51 -> architect 71, wpm 60 -> (60-51)/(71-51) = 45%
    expect(screen.getByTestId('rank-gauge-fill')).toHaveStyle({ width: '45%' });
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '60',
    );
  });

  it('au palier maximum : pas de jauge, texte "maximum" mis en avant', () => {
    render(
      <RankLadder
        currentRank="ghost"
        currentWpm={120}
        labels={labels}
        nextRankText={(l, w, g) => `${l} ${w} ${g}`}
        maxedText="Palier maximum"
      />,
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Palier maximum')).toBeInTheDocument();
  });

  it('borne l’écart à zéro si le WPM courant dépasse déjà le seuil suivant', () => {
    const nextRankText = vi.fn(
      (l: string, w: number, g: number) => `${l} ${w} ${g}`,
    );
    render(
      <RankLadder
        currentRank="operator"
        currentWpm={90}
        labels={labels}
        nextRankText={nextRankText}
        maxedText="max"
      />,
    );
    expect(nextRankText).toHaveBeenCalledWith('Architecte', 71, 0);
  });
});
