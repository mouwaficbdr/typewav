import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { hasCompletedOnboarding, markOnboardingComplete } from '../onboarding';

describe('hasCompletedOnboarding / markOnboardingComplete', () => {
  it('retourne false avant toute sauvegarde (premier visiteur)', async () => {
    expect(await hasCompletedOnboarding()).toBe(false);
  });

  it('retourne true après markOnboardingComplete', async () => {
    await markOnboardingComplete();
    expect(await hasCompletedOnboarding()).toBe(true);
  });
});
