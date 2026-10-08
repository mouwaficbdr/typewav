import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fr from '@/messages/fr.json';
import { OnboardingFlow } from '../OnboardingFlow';

vi.mock('next-intl', async () => (await import('../../__tests__/intl')).nextIntlFr);

const { audio } = vi.hoisted(() => ({
  audio: {
    initialize: vi.fn(async () => undefined),
    playNoteName: vi.fn(async (_note: string, _duration?: number) => undefined),
  },
}));
vi.mock('@/hooks/useAudioEngine', () => ({ useAudioEngine: () => audio }));

const { layoutPref } = vi.hoisted(() => ({
  layoutPref: { layout: 'azerty' as 'azerty' | 'qwerty', setLayout: vi.fn() },
}));
vi.mock('@/hooks/useKeyboardLayoutPreference', () => ({
  useKeyboardLayoutPreference: () => layoutPref,
}));

const { onboarding } = vi.hoisted(() => ({
  onboarding: { markOnboardingComplete: vi.fn(async () => undefined) },
}));
vi.mock('@/lib/onboarding', () => onboarding);

const { saveProfile } = vi.hoisted(() => ({ saveProfile: vi.fn(async () => true) }));
vi.mock('@/lib/conservatoire/profile', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/conservatoire/profile')>()),
  saveProfile,
}));

vi.mock('@/lib/conservatoire/layout-detection', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/conservatoire/layout-detection')>()),
  detectLayoutFromNavigator: vi.fn(async () => null),
}));

vi.mock('../PlacementTest', () => ({
  PlacementTest: ({ onDone }: { onDone: (r: { wpm: number; accuracy: number }) => void }) => (
    <button type="button" onClick={() => onDone({ wpm: 34, accuracy: 96 })}>
      fin du placement
    </button>
  ),
}));

const ob = fr.conservatoire.onboarding;
const SCALE = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'];
const originalGetContext = HTMLCanvasElement.prototype.getContext;

function press(code: string, init: Partial<KeyboardEventInit> = {}) {
  fireEvent.keyDown(window, { code, key: '', ...init });
}
function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}
function title() {
  return screen.getByRole('heading', { level: 1 }).textContent;
}
function renderFlow() {
  const onComplete = vi.fn();
  const onSkip = vi.fn();
  const utils = render(<OnboardingFlow onComplete={onComplete} onSkip={onSkip} />);
  return { ...utils, onComplete, onSkip };
}
function toScale() {
  press('Space');
  press('KeyF');
  wait(650);
  press('KeyJ');
  wait(650);
}
function toBlind() {
  toScale();
  SCALE.forEach((c) => press(c));
  press('Space');
}
function toSilence() {
  toBlind();
  SCALE.forEach((c) => press(c));
  press('Space');
}
function toData() {
  toSilence();
  press('KeyK');
  press('KeyX');
  press('Space');
}

beforeEach(() => {
  vi.useFakeTimers();
  HTMLCanvasElement.prototype.getContext = (() => null) as never;
  layoutPref.layout = 'azerty';
  layoutPref.setLayout.mockClear();
  audio.initialize.mockClear();
  audio.playNoteName.mockClear();
  onboarding.markOnboardingComplete.mockReset().mockResolvedValue(undefined);
  saveProfile.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
  HTMLCanvasElement.prototype.getContext = originalGetContext;
});

describe("OnboardingFlow : l'instrument (écrans 0 à 5)", () => {
  it('Espace active le son puis montre F, seule touche en couleur', () => {
    const { container } = renderFlow();
    expect(title()).toBe(ob.intro.title);
    press('Space');
    expect(audio.initialize).toHaveBeenCalledOnce();
    expect(title()).toBe(ob.f.title);
    const targets = container.querySelectorAll('[data-target]');
    expect(targets).toHaveLength(1);
    expect(targets[0]).toHaveAttribute('data-code', 'KeyF');
    expect(screen.getByText(fr.typing.finger.LI)).toBeInTheDocument();
  });

  it('F joue fa et lance une onde ; une autre touche ne fait rien', () => {
    const { container } = renderFlow();
    press('Space');
    const keyboard = container.querySelector('[data-living-keyboard]');
    press('KeyJ');
    expect(audio.playNoteName).not.toHaveBeenCalled();
    expect(keyboard).not.toHaveAttribute('data-ripple-count');
    press('KeyF');
    expect(audio.playNoteName).toHaveBeenCalledWith('F4');
    expect(keyboard).toHaveAttribute('data-ripple-count', '1');
    expect(title()).toBe(ob.f.title);
    wait(650);
    expect(title()).toBe(ob.j.title);
    press('KeyJ');
    expect(audio.playNoteName).toHaveBeenLastCalledWith('G4');
  });

  it('la gamme du repos joue do ré mi fa sol la si do, puis la cadence', () => {
    renderFlow();
    toScale();
    audio.playNoteName.mockClear();
    expect(title()).toBe(ob.scale.title);
    SCALE.forEach((c) => press(c));
    expect(audio.playNoteName.mock.calls.map((c) => c[0])).toEqual([
      'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5',
    ]);
    expect(title()).toBe(ob.scale.done);
    wait(1000);
    expect(audio.playNoteName).toHaveBeenCalledWith('C5', 1.1);
  });

  it("sans regarder : aucune cible, puis le contour après 1,6 s d'hésitation", () => {
    const { container } = renderFlow();
    toBlind();
    expect(title()).toBe(ob.blind.title);
    expect(container.querySelector('[data-target]')).toBeNull();
    wait(1599);
    expect(container.querySelector('[data-target]')).toBeNull();
    wait(1);
    const hint = container.querySelector('[data-target]');
    expect(hint).toHaveAttribute('data-code', 'KeyA');
    expect(hint).toHaveAttribute('data-target', 'faint');
  });

  it("répétition et raccourcis ne jouent rien et n'avancent rien", () => {
    renderFlow();
    press('Space');
    press('KeyF', { repeat: true });
    press('KeyF', { ctrlKey: true });
    press('KeyF', { altKey: true });
    press('KeyF', { metaKey: true });
    expect(audio.playNoteName).not.toHaveBeenCalled();
    wait(650);
    expect(title()).toBe(ob.f.title);
  });

  it('K joue une note, une autre touche ne joue rien : le silence', () => {
    renderFlow();
    toSilence();
    expect(title()).toBe(ob.silence.title);
    press('KeyK');
    expect(audio.playNoteName).toHaveBeenLastCalledWith('A4');
    expect(title()).toBe(ob.silence.other);
    audio.playNoteName.mockClear();
    press('KeyQ');
    expect(audio.playNoteName).not.toHaveBeenCalled();
    expect(title()).toBe(ob.silence.done);
  });

  it('la disposition est détectée à la première touche discriminante', () => {
    renderFlow();
    press('KeyA', { key: 'a' });
    expect(layoutPref.setLayout).toHaveBeenCalledWith('qwerty');
  });

  it("Verr. Maj ne fausse pas la détection, et rien n'est écrit si la disposition ne change pas", () => {
    layoutPref.layout = 'qwerty';
    renderFlow();
    press('KeyQ', { key: 'Q' });
    expect(layoutPref.setLayout).not.toHaveBeenCalled();
    press('KeyA', { key: 'Q' });
    expect(layoutPref.setLayout).toHaveBeenCalledWith('azerty');
  });
});

describe('OnboardingFlow : données, choix, fin (écrans 6 à 10)', () => {
  it('I ouvre et ferme le détail des données, Espace continue', () => {
    renderFlow();
    toData();
    expect(title()).toBe(ob.data.title);
    expect(screen.queryByText(ob.data.detail2)).toBeNull();
    press('KeyI');
    for (const line of [ob.data.detail1, ob.data.detail2, ob.data.detail3]) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    press('KeyI');
    expect(screen.queryByText(ob.data.detail2)).toBeNull();
    press('Space');
    expect(title()).toBe(ob.experience.title);
  });

  it('1, 2, 3 par position physique ; « Je débute » saute le placement', async () => {
    const { onComplete } = renderFlow();
    toData();
    press('Space');
    press('Digit1', { key: '&' });
    expect(audio.playNoteName).toHaveBeenLastCalledWith('E5', 0.3);
    expect(screen.getByRole('button', { name: /Je débute/ })).toHaveAttribute('aria-pressed', 'true');
    wait(400);
    expect(title()).toBe(ob.minutes.title);
    press('Numpad2', { key: '2' });
    wait(400);
    expect(title()).toBe(ob.ready.title);
    await act(async () => {
      press('Space');
    });
    expect(onboarding.markOnboardingComplete).toHaveBeenCalledOnce();
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 1,
        experience: 'beginner',
        dailyMinutes: 10,
        placement: null,
        outcome: 'lesson1',
        skipped: false,
      }),
    );
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('« Sans regarder » : placement, un seul résultat, puis la première leçon', async () => {
    renderFlow();
    toData();
    press('Space');
    press('Digit3');
    wait(400);
    press('Digit1');
    wait(400);
    expect(title()).toBe(ob.placement.title);
    fireEvent.click(screen.getByRole('button', { name: 'fin du placement' }));
    expect(title()).toBe('34 mots par minute, 96 % de notes justes.');
    press('Space');
    expect(title()).toBe(ob.ready.title);
    await act(async () => {
      press('Space');
    });
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        experience: 'touch-typist',
        dailyMinutes: 5,
        placement: { wpm: 34, accuracy: 96 },
        outcome: 'cycle1-validated',
      }),
    );
  });

  it("« Passer » avant l'écran des données y mène d'abord, puis sort", async () => {
    const { onSkip, onComplete } = renderFlow();
    press('Space');
    fireEvent.click(screen.getByRole('button', { name: fr.conservatoire.skip }));
    expect(title()).toBe(ob.data.title);
    expect(screen.queryByRole('button', { name: fr.conservatoire.skip })).toBeNull();
    await act(async () => {
      press('Space');
    });
    expect(onSkip).toHaveBeenCalledOnce();
    expect(onComplete).not.toHaveBeenCalled();
    expect(onboarding.markOnboardingComplete).toHaveBeenCalledOnce();
    expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ skipped: true, outcome: null }));
  });

  it("« Passer » après l'écran des données sort aussitôt", async () => {
    const { onSkip } = renderFlow();
    toData();
    press('Space');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: fr.conservatoire.skip }));
    });
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('Espace sur un bouton focalisé est laissé au bouton : une seule action', () => {
    renderFlow();
    const skip = screen.getByRole('button', { name: fr.conservatoire.skip });
    skip.focus();
    fireEvent.keyDown(skip, { code: 'Space', key: ' ' });
    expect(title()).toBe(ob.intro.title);
    expect(audio.initialize).not.toHaveBeenCalled();
  });

  it("IndexedDB indisponible : la fin de l'onboarding n'est jamais bloquée", async () => {
    onboarding.markOnboardingComplete.mockRejectedValueOnce(new Error('IndexedDB indisponible'));
    saveProfile.mockResolvedValueOnce(false);
    const { onComplete } = renderFlow();
    toData();
    press('Space');
    press('Digit1');
    wait(400);
    press('Digit1');
    wait(400);
    await act(async () => {
      press('Space');
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
