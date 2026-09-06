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

vi.mock('@/components/typing/SessionWaveform', () => ({
  SessionWaveform: () => <div data-testid="session-waveform" />,
}));

vi.mock('@/lib/db', () => ({
  getSessionById: vi.fn(() => Promise.resolve(null)),
}));

// prefers-reduced-motion pilotable par test. AmbientAura le lit depuis ce module.
const { mockUseReducedMotion } = vi.hoisted(() => ({
  mockUseReducedMotion: vi.fn(() => false),
}));
vi.mock('motion/react', () => {
  const mk = (tag: string) => {
    const C = ({
      children,
      initial: _i,
      animate: _a,
      transition: _t,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) => {
      const El = tag as unknown as React.ElementType;
      return <El {...props}>{children}</El>;
    };
    C.displayName = `motion.${tag}`;
    return C;
  };
  return {
    motion: {
      div: mk('div'),
      p: mk('p'),
      span: mk('span'),
      rect: mk('rect'),
    },
    useReducedMotion: () => mockUseReducedMotion(),
  };
});

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { ResultsPage } from '../typing/ResultsPage';

const baseProps = {
  wpm: 82,
  wpmRaw: 87,
  accuracy: 96,
  consistency: 88,
  durationMs: 51000,
  mode: 'classic' as TypingMode,
};

// L'aura ambiante : conteneur fixed, aria-hidden, blobs enfants.
function auraWrapper(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(
    'div[aria-hidden="true"][style*="position: fixed"]',
  );
}

beforeEach(() => {
  mockUseReducedMotion.mockReturnValue(false);
});
afterEach(() => {
  mockUseReducedMotion.mockReturnValue(false);
});

describe('ResultsPage : Peak-End (aura ambiante)', () => {
  it("porte l'aura ambiante derrière les résultats, décorative et non bloquante", () => {
    const { container } = render(<ResultsPage {...baseProps} />);
    const aura = auraWrapper(container);
    expect(aura).not.toBeNull();
    expect(aura).toHaveAttribute('aria-hidden', 'true');
    expect(aura?.style.pointerEvents).toBe('none');
    expect(aura?.style.zIndex).toBe('-1');
  });

  it("teinte l'aura avec l'accent de marque (juste même en chargement à froid)", () => {
    const { container } = render(<ResultsPage {...baseProps} />);
    const glow = auraWrapper(container)?.querySelector<HTMLElement>('div');
    expect(glow?.style.background).toContain('var(--color-accent)');
  });

  it('respecte prefers-reduced-motion : aura figée', () => {
    mockUseReducedMotion.mockReturnValue(true);
    const { container } = render(
      <ResultsPage {...baseProps} isNewWpmRecord isNewAccuracyRecord />,
    );
    const glow = auraWrapper(container)?.querySelector<HTMLElement>('div');
    expect(glow?.style.animation).toBe('none');
  });

  it('sur un nouveau record, déclenche un unique swell (celebrate) sans planter', async () => {
    const { container } = render(
      <ResultsPage {...baseProps} isNewWpmRecord isNewAccuracyRecord={false} />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    const glow = auraWrapper(container)?.querySelector<HTMLElement>('div');
    const mix = glow?.style.background.match(/var\(--color-accent\)\s+(\d+)%/);
    expect(mix).not.toBeNull();
    expect(Number(mix?.[1])).toBeGreaterThan(60);
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
    const mix = glow?.style.background.match(/var\(--color-accent\)\s+(\d+)%/);
    expect(Number(mix?.[1])).toBeLessThanOrEqual(35);
  });
});
