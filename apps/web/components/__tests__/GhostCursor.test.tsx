import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// `animate` (x/y/opacity) exposé en data-attributes plutôt qu'avalé : c'est
// la seule façon d'observer la position calculée par le moteur du fantôme
// depuis le DOM rendu (les vraies valeurs vivent dans le système d'animation
// de motion/react, jamais dans `style` en dehors de ce mock).
vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      style,
      animate,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      animate?: { x?: number; y?: number; opacity?: number };
    }) => (
      <div
        style={style}
        data-motion-x={animate?.x}
        data-motion-opacity={animate?.opacity}
        {...rest}
      >
        {children}
      </div>
    ),
  },
  useReducedMotion: () => false,
}));

import { GhostCursor } from '../typing/GhostCursor';

const wordsRef = { current: null } as React.RefObject<HTMLDivElement | null>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GhostCursor — Fix C (suppression label texte)', () => {
  it("n'affiche pas de label texte 'record' qui chevaucherait le contenu", () => {
    render(
      <GhostCursor
        ghostTimings={[100, 200, 150]}
        textLength={10}
        wordsRef={wordsRef}
        isSessionActive={true}
      />,
    );
    expect(screen.queryByText(/record/i)).not.toBeInTheDocument();
  });

  it("n'affiche pas le label '👻 record'", () => {
    render(
      <GhostCursor
        ghostTimings={[100, 200]}
        textLength={10}
        wordsRef={wordsRef}
        isSessionActive={true}
      />,
    );
    expect(screen.queryByText(/👻\s*record/i)).not.toBeInTheDocument();
  });
});

describe('GhostCursor : ne demarre pas avant la vraie session (audit ticket #63)', () => {
  function makeWordsContainer(charCount: number) {
    const container = document.createElement('div');
    for (let i = 0; i < charCount; i++) {
      const span = document.createElement('span');
      span.dataset.testid = `char-${i}`;
      Object.defineProperty(span, 'getBoundingClientRect', {
        value: () => ({
          left: i * 10,
          top: 0,
          width: 10,
          height: 20,
          right: i * 10 + 10,
          bottom: 20,
          x: i * 10,
          y: 0,
          toJSON: () => ({}),
        }),
      });
      container.appendChild(span);
    }
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: charCount * 10,
        height: 20,
        right: charCount * 10,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(container);
    return container;
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ne rend rien tant que isSessionActive est faux, meme apres un long delai', () => {
    const el = makeWordsContainer(5);
    const ref = { current: el } as React.RefObject<HTMLDivElement | null>;
    render(
      <GhostCursor
        ghostTimings={[100, 100, 100, 100, 100]}
        textLength={5}
        wordsRef={ref}
        isSessionActive={false}
      />,
    );
    vi.advanceTimersByTime(5000);
    // Rien a montrer : le curseur fantome ne doit produire aucun element.
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
    el.remove();
  });

  it("reste monte en continu au passage d'un espace de largeur 0 (frontiere de mot)", () => {
    // Reproduit exactement la structure reelle : un espace entre deux mots a
    // une largeur de 0px tant que le VRAI curseur (independant du fantome)
    // n'est pas dessus (voir TypingArea, char-space). "Nous avons" : indices
    // 0-3 = "Nous", 4 = espace (largeur 0), 5-9 = "avons".
    const widths = [10, 10, 10, 10, 0, 10, 10, 10, 10, 10];
    const container = document.createElement('div');
    widths.forEach((w, i) => {
      const span = document.createElement('span');
      span.dataset.testid = `char-${i}`;
      Object.defineProperty(span, 'getBoundingClientRect', {
        value: () => ({
          left: i * 12,
          top: 0,
          width: w,
          height: 20,
          right: i * 12 + w,
          bottom: 20,
          x: i * 12,
          y: 0,
          toJSON: () => ({}),
        }),
      });
      container.appendChild(span);
    });
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 120,
        height: 20,
        right: 120,
        bottom: 20,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(container);
    const ref = { current: container } as React.RefObject<HTMLDivElement | null>;

    const timings = widths.map(() => 100); // 100ms par caractere, y compris l'espace
    const { rerender } = render(
      <GhostCursor
        ghostTimings={timings}
        textLength={widths.length}
        wordsRef={ref}
        isSessionActive={true}
      />,
    );

    // Position 0 : premiere lettre de "Nous", largeur normale -> deja monte.
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull();

    // Avance manuellement jusqu'a l'espace (position 4, largeur 0) puis au
    // premier caractere du mot suivant (position 5) : a chaque etape, le
    // composant ne doit jamais redevenir absent du DOM.
    for (const pos of [1, 2, 3, 4, 5, 6]) {
      act(() => {
        vi.advanceTimersByTime(100);
      });
      rerender(
        <GhostCursor
          ghostTimings={timings}
          textLength={widths.length}
          wordsRef={ref}
          isSessionActive={true}
        />,
      );
      const cursor = document.querySelector('[aria-hidden="true"]');
      expect(cursor, `absent a la position ${pos}`).not.toBeNull();
    }
    container.remove();
  });

  it('avance de facon monotone une fois isSessionActive vrai, sans jamais reculer', () => {
    const el = makeWordsContainer(5);
    const ref = { current: el } as React.RefObject<HTMLDivElement | null>;
    const { rerender } = render(
      <GhostCursor
        ghostTimings={[100, 100, 100, 100, 100]}
        textLength={5}
        wordsRef={ref}
        isSessionActive={true}
      />,
    );

    const seenX: number[] = [];
    for (let i = 0; i < 6; i++) {
      act(() => {
        vi.advanceTimersByTime(100);
      });
      rerender(
        <GhostCursor
          ghostTimings={[100, 100, 100, 100, 100]}
          textLength={5}
          wordsRef={ref}
          isSessionActive={true}
        />,
      );
      const cursor = document.querySelector(
        '[aria-hidden="true"]',
      ) as HTMLElement | null;
      const x = cursor?.getAttribute('data-motion-x');
      if (x !== null && x !== undefined) seenX.push(parseFloat(x));
    }

    // Au moins une avancee observee (le texte de 5 caracteres a bien ete
    // parcouru), et jamais de retour en arriere dans la sequence.
    expect(seenX.length).toBeGreaterThan(0);
    expect(Math.max(...seenX)).toBeGreaterThan(seenX[0]!);
    for (let i = 1; i < seenX.length; i++) {
      expect(seenX[i]).toBeGreaterThanOrEqual(seenX[i - 1]!);
    }
    el.remove();
  });
});
