import { MILESTONES } from '@typewav/types';
import { describe, expect, it } from 'vitest';
import { APP_THEMES, BASE_UNLOCKED_THEME_IDS } from '../theme/defaultThemes';

/**
 * Cohérence du système de thèmes (WS-5 #6).
 *
 * Deux sources de thèmes coexistaient : `APP_THEMES` (rendu par l'app) et
 * `@typewav/themes` (jamais importé). Les jalons `MILESTONES` récompensaient
 * `noir` / `midnight-sun` / `arcade`, absents d'`APP_THEMES` : récompense
 * creuse (`APP_THEMES[id] ?? terminal`). Ces gardes verrouillent la
 * réconciliation.
 */

const milestoneThemeIds = MILESTONES.flatMap((m) =>
  m.reward.type === 'theme' ? [m.reward.themeId] : [],
);

describe('APP_THEMES', () => {
  it('contient les 4 thèmes de base et les 3 thèmes de jalon', () => {
    expect(Object.keys(APP_THEMES).sort()).toEqual(
      [
        'terminal',
        'deep-burgundy',
        'cyprus-sand',
        'night-imperial',
        'noir',
        'midnight-sun',
        'arcade',
      ].sort(),
    );
  });

  it('chaque entrée porte un `id` égal à sa clé', () => {
    for (const [key, theme] of Object.entries(APP_THEMES)) {
      expect(theme.id).toBe(key);
    }
  });
});

describe('récompenses de thème des jalons', () => {
  it('chaque jalon qui débloque un thème pointe vers un thème rendu', () => {
    for (const themeId of milestoneThemeIds) {
      expect(Object.keys(APP_THEMES)).toContain(themeId);
    }
  });

  it('récompense noir, midnight-sun et arcade (dette WS-5 #6)', () => {
    expect(milestoneThemeIds.sort()).toEqual(
      ['arcade', 'midnight-sun', 'noir'].sort(),
    );
  });
});

describe('BASE_UNLOCKED_THEME_IDS', () => {
  it('est la seule vérité des thèmes débloqués d’office', () => {
    expect([...BASE_UNLOCKED_THEME_IDS].sort()).toEqual(
      ['terminal', 'deep-burgundy', 'cyprus-sand', 'night-imperial'].sort(),
    );
  });

  it('partitionne APP_THEMES avec les thèmes de jalon (disjoint, exhaustif)', () => {
    const base = new Set<string>(BASE_UNLOCKED_THEME_IDS);
    const gated = new Set(milestoneThemeIds);

    for (const id of base) expect(gated.has(id)).toBe(false);
    expect(new Set([...base, ...gated])).toEqual(
      new Set(Object.keys(APP_THEMES)),
    );
  });
});
