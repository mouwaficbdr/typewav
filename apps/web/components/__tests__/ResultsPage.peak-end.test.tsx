import { act, render } from '@testing-library/react';
import type { TypingMode } from '@typewav/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useAudioEngine', () => ({
  useAudioEngine: () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    playNoteName: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({ user: null, isPremium: false }),
}));

vi.mock('@/components/typing/WpmChart', () => ({
  WpmChart: () => <div data-testid="wpm-chart" />,
}));

// prefers-reduced-motion pilotable par test. AmbientAura et WaveformBars
// lisent tous deux useReducedMotion depuis ce module.
const mockUseReducedMotion = vi.fn(() => false);
vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => mockUseReducedMotion(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { ResultsPage } from '../typing/ResultsPage';

const baseProps = {
  wpm: 87,
  wpmNet: 82,
  accuracy: 96,
  consistency: 88,
  durationMs: 51000,
  mode: 'classic' as TypingMode,
};

// L'aura ambiante : conteneur fixed, aria-hidden, 2 blobs enfants.
// La bande WaveformBars : conteneur aria-hidden, 12 barres enfants.
function auraWrapper(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(
    'div[aria-hidden="true"][style*="position: fixed"]',
  );
}
function barsChildren(container: HTMLElement): HTMLElement[] {
  const hidden = Array.from(
    container.querySelectorAll<HTMLElement>('div[aria-hidden="true"]'),
  );
  const barsRoot = hidden.find((el) => el.children.length === 12) ?? null;
  return barsRoot
    ? (Array.from(barsRoot.children) as HTMLElement[])
    : [];
}

beforeEach(() => {
  mockUseReducedMotion.mockReturnValue(false);
});

afterEach(() => {
  mockUseReducedMotion.mockReturnValue(false);
});

describe('ResultsPage — Peak-End (langage AmbientAura / WaveformBars)', () => {
  it("porte l'aura ambiante derrière les résultats, décorative et non bloquante", () => {
    const { container } = render(<ResultsPage {...baseProps} />);

    const aura = auraWrapper(container);
    expect(aura).not.toBeNull();
    expect(aura).toHaveAttribute('aria-hidden', 'true');
    expect(aura?.style.pointerEvents).toBe('none');
    // Derrière tout le contenu réel.
    expect(aura?.style.zIndex).toBe('-1');
  });

  it("porte une bande d'égaliseur WaveformBars (12 barres, aria-hidden)", () => {
    const { container } = render(<ResultsPage {...baseProps} />);
    expect(barsChildren(container)).toHaveLength(12);
  });

  it("teinte l'aura avec l'accent de marque, pas une couleur de rang à froid", () => {
    const { container } = render(<ResultsPage {...baseProps} />);
    const glow = auraWrapper(container)?.querySelector<HTMLElement>('div');
    expect(glow?.style.background).toContain('var(--color-accent)');
  });

  it('respecte prefers-reduced-motion : aura figée, aucune pulsation de bande', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { container } = render(
      <ResultsPage {...baseProps} isNewWpmRecord isNewAccuracyRecord />,
    );

    const glow = auraWrapper(container)?.querySelector<HTMLElement>('div');
    expect(glow?.style.animation).toBe('none');

    const bars = barsChildren(container);
    expect(bars).toHaveLength(12);
    expect(
      bars.every((bar) => !bar.style.animation.includes('typewav-idle-pulse')),
    ).toBe(true);
  });

  it('sur un nouveau record, déclenche un unique swell (celebrate) sans planter', async () => {
    const { container } = render(
      <ResultsPage {...baseProps} isNewWpmRecord isNewAccuracyRecord={false} />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const glow = auraWrapper(container)?.querySelector<HTMLElement>('div');
    // Le swell pousse l'opacité du color-mix bien au-dessus du repos (35%).
    const mixMatch = glow?.style.background.match(/var\(--color-accent\)\s+(\d+)%/);
    expect(mixMatch).not.toBeNull();
    expect(Number(mixMatch?.[1])).toBeGreaterThan(60);
  });

  it('sans record, pas de swell : aura au repos', async () => {
    const { container } = render(
      <ResultsPage
        {...baseProps}
        isNewWpmRecord={false}
        isNewAccuracyRecord={false}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const glow = auraWrapper(container)?.querySelector<HTMLElement>('div');
    const mixMatch = glow?.style.background.match(/var\(--color-accent\)\s+(\d+)%/);
    expect(Number(mixMatch?.[1])).toBeLessThanOrEqual(35);
  });
});
