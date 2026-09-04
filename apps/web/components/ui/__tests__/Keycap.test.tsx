import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Keycap } from '../Keycap';

describe('Keycap', () => {
  it('rend un élément <kbd> sémantique', () => {
    render(<Keycap>Tab</Keycap>);
    const el = screen.getByText('Tab');
    expect(el.tagName).toBe('KBD');
  });

  it('affiche son contenu, mot ou glyphe', () => {
    render(
      <>
        <Keycap>Échap</Keycap>
        <Keycap>↵</Keycap>
      </>,
    );
    expect(screen.getByText('Échap')).toBeInTheDocument();
    expect(screen.getByText('↵')).toBeInTheDocument();
  });

  it('transmet className pour permettre un état :active côté consommateur', () => {
    render(<Keycap className="key-pressed">A</Keycap>);
    expect(screen.getByText('A')).toHaveClass('key-pressed');
  });

  it('accepte les deux tailles sans changer la sémantique', () => {
    const { rerender } = render(<Keycap size="sm">X</Keycap>);
    expect(screen.getByText('X').tagName).toBe('KBD');
    rerender(<Keycap size="md">X</Keycap>);
    expect(screen.getByText('X').tagName).toBe('KBD');
  });
});
