import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeyboardDiagramAzerty } from '../KeyboardDiagramAzerty';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';

describe('KeyboardDiagramAzerty', () => {
  it('rend les 5 rangées (chiffres, haut, repos, bas, modificateurs)', () => {
    const { container } = render(<KeyboardDiagramAzerty />);
    // Chaque touche = un <g data-key="...">. Résolution par getAttribute plutôt
    // que par sélecteur CSS : le moteur de sélecteurs de jsdom (nwsapi) ne sait
    // pas matcher un « & » littéral dans un sélecteur d'attribut (même en *=),
    // seulement via l'échappement unicode `\26 `. getAttribute compare la vraie
    // valeur du DOM, sans cette limite.
    const dataKeys = new Set(
      [...container.querySelectorAll('[data-key]')].map((el) =>
        el.getAttribute('data-key'),
      ),
    );
    expect(dataKeys.has('&')).toBe(true); // rangée chiffres
    expect(dataKeys.has('a')).toBe(true); // rangée haut
    expect(dataKeys.has('q')).toBe(true); // repos
    expect(dataKeys.has(',')).toBe(true); // bas
    expect(dataKeys.has('ShiftLeft')).toBe(true);
    expect(dataKeys.has('ShiftRight')).toBe(true);
  });

  it('surligne les highlightKeys', () => {
    const l3 = LEARNING_CURRICULUM_AZERTY[2]!; // top-row
    const { container } = render(<KeyboardDiagramAzerty highlightKeys={l3.newKeys} />);
    const aKey = container.querySelector('[data-key="a"]');
    expect(aKey?.getAttribute('data-highlight')).toBe('true');
    expect(container.querySelector('[data-key="w"]')?.getAttribute('data-highlight')).toBeNull();
  });

  it('geste Maj : marque la touche Maj de la main attendue en maintien', () => {
    const { container } = render(
      <KeyboardDiagramAzerty activeKeyId="E" expectedShiftHand="R" />,
    );
    expect(container.querySelector('[data-key="ShiftRight"]')?.getAttribute('data-hold')).toBe('true');
    expect(container.querySelector('[data-key="ShiftLeft"]')?.getAttribute('data-hold')).toBeNull();
  });

  it('touche morte : étape 1 pulse "^", étape 2 pulse la voyelle', () => {
    const step1 = render(<KeyboardDiagramAzerty activeKeyId="^e" deadKeyStep={1} />);
    expect(step1.container.querySelector('[data-key="^"]')?.getAttribute('data-active')).toBe('true');
    const step2 = render(<KeyboardDiagramAzerty activeKeyId="^e" deadKeyStep={2} />);
    expect(step2.container.querySelector('[data-key="e"]')?.getAttribute('data-active')).toBe('true');
  });
});
