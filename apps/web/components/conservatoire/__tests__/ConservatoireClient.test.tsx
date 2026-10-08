import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '@/messages/fr.json';
import { ConservatoireClient } from '../ConservatoireClient';

vi.mock('next-intl', async () => (await import('./intl')).nextIntlFr);

const { router } = vi.hoisted(() => ({ router: { push: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const { audio } = vi.hoisted(() => ({ audio: { loadMidiPiece: vi.fn(async () => undefined) } }));
vi.mock('@/hooks/useAudioEngine', () => ({ useAudioEngine: () => audio }));

const { flags } = vi.hoisted(() => ({
  flags: { hasCompletedOnboarding: vi.fn(async () => false), nonDesktop: false },
}));
vi.mock('@/lib/onboarding', () => ({
  hasCompletedOnboarding: () => flags.hasCompletedOnboarding(),
}));
vi.mock('@/lib/device', () => ({ isNonDesktopDevice: () => flags.nonDesktop }));

vi.mock('@/components/modes/LearningMode', () => ({
  LearningMode: () => <div data-testid="learning-mode" />,
}));
vi.mock('../onboarding/OnboardingFlow', () => ({
  OnboardingFlow: ({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) => (
    <div data-testid="onboarding">
      <button type="button" onClick={onComplete}>fin</button>
      <button type="button" onClick={onSkip}>passer</button>
    </div>
  ),
}));

beforeEach(() => {
  flags.nonDesktop = false;
  flags.hasCompletedOnboarding.mockReset().mockResolvedValue(false);
  router.push.mockClear();
  audio.loadMidiPiece.mockClear();
});

describe('ConservatoireClient', () => {
  it("première visite : l'onboarding, puis la première leçon", async () => {
    render(<ConservatoireClient />);
    expect(await screen.findByTestId('onboarding')).toBeInTheDocument();
    expect(audio.loadMidiPiece).toHaveBeenCalledWith('fur-elise');
    fireEvent.click(screen.getByRole('button', { name: 'fin' }));
    expect(screen.getByTestId('learning-mode')).toBeInTheDocument();
  });

  it("« Passer » ramène à l'accueil de TypeWav", async () => {
    render(<ConservatoireClient />);
    fireEvent.click(await screen.findByRole('button', { name: 'passer' }));
    expect(router.push).toHaveBeenCalledWith('/fr');
  });

  it("onboarding déjà fait : l'espace directement", async () => {
    flags.hasCompletedOnboarding.mockResolvedValue(true);
    render(<ConservatoireClient />);
    expect(await screen.findByTestId('learning-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding')).toBeNull();
  });

  it("rien tant que le drapeau n'est pas lu (pas de flash)", () => {
    flags.hasCompletedOnboarding.mockImplementation(() => new Promise<boolean>(() => {}));
    render(<ConservatoireClient />);
    expect(screen.queryByTestId('onboarding')).toBeNull();
    expect(screen.queryByTestId('learning-mode')).toBeNull();
  });

  it('sur mobile : un seul écran, aucune lecture du drapeau', async () => {
    flags.nonDesktop = true;
    render(<ConservatoireClient />);
    expect(
      await screen.findByRole('heading', { name: fr.conservatoire.mobile }),
    ).toBeInTheDocument();
    expect(flags.hasCompletedOnboarding).not.toHaveBeenCalled();
  });

  it("IndexedDB illisible : l'onboarding se joue quand même, avec une ligne honnête", async () => {
    flags.hasCompletedOnboarding.mockRejectedValue(new Error('IndexedDB indisponible'));
    render(<ConservatoireClient />);
    expect(await screen.findByTestId('onboarding')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('note')).toHaveTextContent(fr.conservatoire.unsaved),
    );
  });
});
