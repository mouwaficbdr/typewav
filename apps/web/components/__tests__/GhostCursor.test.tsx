import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      style,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement>) => (
      <div style={style} {...rest}>
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
      />,
    );
    expect(screen.queryByText(/👻\s*record/i)).not.toBeInTheDocument();
  });
});
