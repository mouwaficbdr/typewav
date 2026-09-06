import { describe, expect, it } from 'vitest';
import { APP_THEMES, BASE_UNLOCKED_THEME_IDS } from '../theme/defaultThemes';

/**
 * Cohérence du système de thèmes.
 *
 * Tous les thèmes rendus par l'app (`APP_THEMES`) sont débloqués d'office :
 * `BASE_UNLOCKED_THEME_IDS` en est la seule vérité, et il couvre exactement
 * `APP_THEMES`. Il n'y a plus de thème derrière un déblocage conditionnel
 * (l'ancien système de jalons a été retiré ; `noir` / `midnight-sun` /
 * `arcade`, jadis récompenses de jalon, sont désormais libres comme les
 * autres).
 */

describe('APP_THEMES', () => {
  it('contient exactement les thèmes débloqués d’office', () => {
    expect(Object.keys(APP_THEMES).sort()).toEqual(
      [...BASE_UNLOCKED_THEME_IDS].sort(),
    );
  });

  it('chaque entrée porte un `id` égal à sa clé', () => {
    for (const [key, theme] of Object.entries(APP_THEMES)) {
      expect(theme.id).toBe(key);
    }
  });

  it('inclut noir, midnight-sun et arcade (anciens thèmes de jalon, désormais libres)', () => {
    for (const id of ['noir', 'midnight-sun', 'arcade']) {
      expect(Object.keys(APP_THEMES)).toContain(id);
      expect(BASE_UNLOCKED_THEME_IDS).toContain(id);
    }
  });
});

describe('BASE_UNLOCKED_THEME_IDS', () => {
  it('est la seule vérité des thèmes débloqués d’office', () => {
    expect([...BASE_UNLOCKED_THEME_IDS].sort()).toEqual(
      [
        'terminal',
        'deep-burgundy',
        'cyprus-sand',
        'night-imperial',
        'terminal-amber',
        'blueprint',
        'matcha',
        'abysse',
        'cuivre-anthracite',
        'sable-lunaire',
        'rouille-lin',
        'bitume-chlorophylle',
        'carbone-menthe',
        'nocturne-dore',
        'cassis',
        'corail-nocturne',
        'ardoise-tilleul',
        'sakura-nuit',
        'neon-tokyo',
        'sable-sahara',
        'vieux-cuivre',
        'glacier',
        'cobalt-industriel',
        'volcan-obsidienne',
        'ardoise-ecarlate',
        'riviera',
        'noir',
        'midnight-sun',
        'arcade',
      ].sort(),
    );
  });

  it('ne contient aucun doublon', () => {
    expect(new Set(BASE_UNLOCKED_THEME_IDS).size).toBe(
      BASE_UNLOCKED_THEME_IDS.length,
    );
  });
});
