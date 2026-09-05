import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  hasCompletedOnboarding,
  hasSeenLearningFingerIntro,
  markLearningFingerIntroSeen,
  markOnboardingComplete,
  resetLearningFingerIntroSeen,
} from '../onboarding';

describe('hasCompletedOnboarding / markOnboardingComplete', () => {
  it('retourne false avant toute sauvegarde (premier visiteur)', async () => {
    expect(await hasCompletedOnboarding()).toBe(false);
  });

  it('retourne true après markOnboardingComplete', async () => {
    await markOnboardingComplete();
    expect(await hasCompletedOnboarding()).toBe(true);
  });
});

describe('écran de positionnement des doigts (ticket #62)', () => {
  it("retourne false avant toute sauvegarde (jamais vu)", async () => {
    expect(await hasSeenLearningFingerIntro()).toBe(false);
  });

  it('retourne true après markLearningFingerIntroSeen', async () => {
    await markLearningFingerIntroSeen();
    expect(await hasSeenLearningFingerIntro()).toBe(true);
  });

  it("resetLearningFingerIntroSeen permet de le revoir manuellement depuis Paramètres", async () => {
    await markLearningFingerIntroSeen();
    expect(await hasSeenLearningFingerIntro()).toBe(true);

    await resetLearningFingerIntroSeen();
    expect(await hasSeenLearningFingerIntro()).toBe(false);
  });
});
