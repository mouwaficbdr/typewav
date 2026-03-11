import { render } from '@testing-library/react';
import type { NoteEvent } from '@typewav/types';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import { SessionWaveform } from '../typing/SessionWaveform';

describe('SessionWaveform', () => {
  it('rend le placeholder quand noteEvents est vide', () => {
    render(<SessionWaveform noteEvents={[]} durationMs={60000} />);
    // Ne plante pas
  });

  it('rend un SVG quand des événements sont présents', () => {
    const events: NoteEvent[] = [
      { noteName: 'C4', timestamp: 0, charIndex: 0, isError: false as const },
      { noteName: 'D4', timestamp: 500, charIndex: 1, isError: false as const },
      {
        noteName: 'E4',
        timestamp: 1000,
        charIndex: 2,
        isError: false as const,
      },
    ];
    const { container } = render(
      <SessionWaveform noteEvents={events} durationMs={60000} />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('rend une figure aria-hidden quand les events sont présents', () => {
    const events: NoteEvent[] = [
      { noteName: 'G4', timestamp: 200, charIndex: 3, isError: false as const },
    ];
    const { container } = render(
      <SessionWaveform noteEvents={events} durationMs={30000} />,
    );
    const figure = container.querySelector('figure');
    expect(figure).toHaveAttribute('aria-hidden', 'true');
  });
});
