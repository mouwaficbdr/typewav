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

describe('KeyboardDiagram — showAllFingerColors (écran de positionnement des doigts, ticket #62)', () => {
  it('sans la prop, les 8 touches home row ne sont pas colorées par doigt (comportement existant)', () => {
    const { container } = render(<KeyboardDiagram allowedKeys={['a', 's', 'd', 'f', 'j', 'k', 'l', ';']} />);
    // Aucune touche active : aucun rect ne doit porter la couleur d'un doigt.
    const coloredRects = Array.from(container.querySelectorAll('rect')).filter(
      (r) => /^#[0-9A-Fa-f]{6}$/.test(r.getAttribute('fill') ?? ''),
    );
    expect(coloredRects).toHaveLength(0);
  });

  it('avec la prop, les 8 touches home row sont simultanément colorées par doigt', () => {
    const { container } = render(
      <KeyboardDiagram
        showAllFingerColors
        allowedKeys={['a', 's', 'd', 'f', 'j', 'k', 'l', ';']}
      />,
    );
    const coloredRects = Array.from(container.querySelectorAll('rect')).filter(
      (r) => /^#[0-9A-Fa-f]{6}$/.test(r.getAttribute('fill') ?? ''),
    );
    expect(coloredRects).toHaveLength(8);
  });

  it('affiche une légende des noms de doigts (accessibilité : ne pas reposer que sur la couleur)', () => {
    render(<KeyboardDiagram showAllFingerColors />);
    expect(screen.getByText(/finger\.LI/)).toBeInTheDocument();
    expect(screen.getByText(/finger\.RP/)).toBeInTheDocument();
  });

  it('agrandit le viewBox pour laisser la place au schéma de mains', () => {
    const { container: withHands } = render(<KeyboardDiagram showAllFingerColors />);
    const { container: without } = render(<KeyboardDiagram />);
    const heightOf = (c: HTMLElement) => {
      const viewBox = c.querySelector('svg')?.getAttribute('viewBox') ?? '';
      return Number(viewBox.split(' ')[3]);
    };
    expect(heightOf(withHands)).toBeGreaterThan(heightOf(without));
  });
});

describe('KeyboardDiagram — confirmedKeys (étape interactive, ticket #62)', () => {
  it("marque visuellement les touches confirmées d'un repère distinct", () => {
    const { container: confirmed } = render(
      <KeyboardDiagram showAllFingerColors confirmedKeys={['f']} />,
    );
    const { container: none } = render(<KeyboardDiagram showAllFingerColors />);
    // Un cercle de confirmation supplémentaire apparaît par touche confirmée.
    expect(confirmed.querySelectorAll('[data-confirmed="true"]')).toHaveLength(1);
    expect(none.querySelectorAll('[data-confirmed="true"]')).toHaveLength(0);
  });
});
