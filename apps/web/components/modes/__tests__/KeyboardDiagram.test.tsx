import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { KeyboardDiagram } from '../KeyboardDiagram';

describe('KeyboardDiagram — disposition QWERTY (par défaut)', () => {
  it('affiche les labels QWERTY sans prop layout', () => {
    render(<KeyboardDiagram />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Q')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText(';')).toBeInTheDocument();
  });

  it('surligne la position physique correspondant à activeKey', () => {
    const { container } = render(<KeyboardDiagram activeKey="a" />);
    const activeRect = container.querySelector('rect[stroke-width="2"]');
    expect(activeRect).not.toBeNull();
    expect(activeRect?.getAttribute('x')).toBe('8');
    expect(activeRect?.getAttribute('y')).toBe('68');
  });
});

describe('KeyboardDiagram — disposition AZERTY (ticket #62)', () => {
  it('échange les labels Q/A (positions physiquement différentes)', () => {
    render(<KeyboardDiagram layout="azerty" />);
    // Position physique home-row-gauche (x:8,y:68) affiche Q en AZERTY.
    // Position physique top-row-gauche (x:0,y:36) affiche A en AZERTY.
    expect(screen.getByText('Q')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it("';' (home row) affiche 'M', et 'm' (bottom row) affiche ',' — pas un simple échange", () => {
    render(<KeyboardDiagram layout="azerty" />);
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText(',')).toBeInTheDocument();
    expect(screen.queryByText(';')).not.toBeInTheDocument();
  });

  it('laisse les touches non affectées identiques en AZERTY', () => {
    render(<KeyboardDiagram layout="azerty" />);
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it("surligne la bonne position physique pour un caractère réellement tapé en AZERTY", () => {
    // 'q' est le caractère produit par la position physique home-row-gauche
    // (x:8,y:68, celle qui affiche 'a' en QWERTY) sur un vrai clavier AZERTY.
    const { container } = render(
      <KeyboardDiagram activeKey="q" layout="azerty" />,
    );
    const activeRect = container.querySelector('rect[stroke-width="2"]');
    expect(activeRect).not.toBeNull();
    expect(activeRect?.getAttribute('x')).toBe('8');
    expect(activeRect?.getAttribute('y')).toBe('68');
  });
});

describe('KeyboardDiagram — agrandissement (ticket #62)', () => {
  it('a un plafond de largeur nettement plus grand que l’ancien (500px)', () => {
    const { container } = render(<KeyboardDiagram />);
    const svg = container.querySelector('svg');
    const maxWidth = svg?.style.maxWidth ?? '';
    const ceilingMatch = maxWidth.match(/,\s*(\d+)px\)/);
    expect(ceilingMatch).not.toBeNull();
    expect(Number(ceilingMatch?.[1])).toBeGreaterThan(500);
  });
});
