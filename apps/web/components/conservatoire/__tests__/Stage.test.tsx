import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import fr from '@/messages/fr.json';
import { Stage } from '../Stage';

vi.mock('next-intl', async () => (await import('./intl')).nextIntlFr);

describe('Stage', () => {
  it("une phrase, une ligne d'appui, l'emplacement et la touche à presser", () => {
    const { container } = render(
      <Stage title="Titre" support="Appui" footer="Espace">
        <div data-testid="contenu" />
      </Stage>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Titre' })).toHaveAttribute('data-part', 'title');
    expect(screen.getByText('Appui')).toHaveAttribute('data-part', 'support');
    expect(container.querySelector('[data-part="slot"]')).toContainElement(screen.getByTestId('contenu'));
    expect(screen.getByText('Espace')).toHaveAttribute('data-part', 'footer');
  });

  it('rien de plus que ce qui est demandé', () => {
    const { container } = render(<Stage title="Seul" />);
    expect(container.querySelectorAll('[data-part]')).toHaveLength(1);
  });

  it("annonce l'écran aux lecteurs d'écran, le titre par défaut", () => {
    const { rerender } = render(<Stage title="Titre" />);
    expect(screen.getByRole('status')).toHaveTextContent('Titre');
    rerender(<Stage title="Titre" announce="Titre Touche F, Index gauche." />);
    expect(screen.getByRole('status')).toHaveTextContent('Titre Touche F, Index gauche.');
  });

  it("« Passer » n'existe que si on le demande", () => {
    const onSkip = vi.fn();
    const { rerender } = render(<Stage title="Titre" />);
    expect(screen.queryByRole('button', { name: fr.conservatoire.skip })).toBeNull();
    rerender(<Stage title="Titre" onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: fr.conservatoire.skip }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("l'emplacement garde la même instance tant que slotKey ne change pas, et en change quand slotKey change (R5)", () => {
    let mounts = 0;
    function Probe() {
      useEffect(() => {
        mounts += 1;
      }, []);
      return <div data-testid="probe" />;
    }

    const { rerender } = render(
      <Stage title="Titre" slotKey="a">
        <Probe />
      </Stage>,
    );
    expect(mounts).toBe(1);

    rerender(
      <Stage title="Titre" slotKey="a">
        <Probe />
      </Stage>,
    );
    expect(mounts).toBe(1); // même identité : pas de remontage, pas de coupure sèche

    rerender(
      <Stage title="Titre" slotKey="b">
        <Probe />
      </Stage>,
    );
    expect(mounts).toBe(2); // nouvelle identité : la transition joue, le contenu remonte
  });
});
