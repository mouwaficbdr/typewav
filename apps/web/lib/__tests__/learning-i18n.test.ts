import { describe, expect, it } from 'vitest';
import fr from '@/messages/fr.json';
import en from '@/messages/en.json';
import { LEARNING_CURRICULUM_AZERTY } from '@typewav/types';

describe('i18n curriculum', () => {
  it('chaque niveau a name/tagline/teach en fr et en', () => {
    for (const level of LEARNING_CURRICULUM_AZERTY) {
      for (const msgs of [fr, en] as const) {
        const node = (msgs as any).learning.level[level.slug];
        expect(node, `${level.slug}`).toBeDefined();
        expect(typeof node.name).toBe('string');
        expect(typeof node.tagline).toBe('string');
        expect(typeof node.teach).toBe('string');
      }
    }
  });

  it('teachStep / mastery / curriculum présents en fr et en', () => {
    for (const msgs of [fr, en] as const) {
      expect((msgs as any).learning.teachStep.start).toBeTruthy();
      expect((msgs as any).learning.mastery.weakKey).toBeTruthy();
      expect((msgs as any).learning.curriculum.levelCounter).toBeTruthy();
    }
  });
});
