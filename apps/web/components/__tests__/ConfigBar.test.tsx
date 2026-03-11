import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/stores/useAudioStore', () => ({
  useAudioStore: () => ({ soundPackId: 'piano', setSoundPack: vi.fn() }),
}));

import { DEFAULT_CONFIG, useConfigStore } from '@/stores/useConfigStore';

// Reset store between tests
afterEach(() => {
  useConfigStore.setState(DEFAULT_CONFIG);
  localStorage.clear();
});

import { ConfigBar } from '../typing/ConfigBar';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ConfigBar', () => {
  it('affiche les modes principaux', () => {
    render(<ConfigBar />);
    expect(screen.getByTitle('Temps')).toBeInTheDocument();
    expect(screen.getByTitle('Mots')).toBeInTheDocument();
    expect(screen.getByTitle('Code')).toBeInTheDocument();
  });

  it('le mode actif (sprint) a aria-pressed="true"', () => {
    useConfigStore.setState({ activeMode: 'sprint' });
    render(<ConfigBar />);
    expect(screen.getByTitle('Mots')).toHaveAttribute('aria-pressed', 'true');
  });

  it('les modificateurs sont cachés sur les modes sans modificateurs (ghost)', () => {
    useConfigStore.setState({ activeMode: 'ghost' });
    render(<ConfigBar />);
    // t('punctuation') → 'punctuation' (mock), not 'Activer la ponctuation'
    expect(screen.queryByTitle('punctuation')).not.toBeInTheDocument();
  });

  it('les modificateurs sont visibles en mode classic', () => {
    render(<ConfigBar />); // activeMode = 'classic' by default
    expect(screen.getByTitle('punctuation')).toBeInTheDocument();
  });

  it('affiche les collections en mode classic (ligne 2)', () => {
    render(<ConfigBar />);
    expect(
      screen.getByRole('button', { name: /littérature/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /poésie/i })).toBeInTheDocument();
  });

  it('affiche les durées en mode classic (ligne 2)', () => {
    render(<ConfigBar />);
    expect(screen.getByRole('button', { name: '30s' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '60s' })).toBeInTheDocument();
  });

  it('affiche les word counts en mode sprint (ligne 2)', () => {
    useConfigStore.setState({ activeMode: 'sprint' });
    render(<ConfigBar />);
    expect(screen.getByRole('button', { name: '25' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '50' })).toBeInTheDocument();
  });

  it('a un role toolbar avec aria-label', () => {
    render(<ConfigBar />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeInTheDocument();
    // t('label') → 'label' via mock
    expect(toolbar).toHaveAttribute('aria-label', 'label');
  });
});
