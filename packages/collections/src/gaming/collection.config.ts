/**
 * Collection Gaming & Pop — textes originaux créés pour TypeWav.
 * Évoque la culture du jeu vidéo, du retro gaming et de l'informatique
 * avec un vocabulaire propre à cette culture.
 *
 * Spec : docs/specs/06-content.md
 * Règle : textes originaux TypeWav (✅ autorisé par la spec)
 */

import type { CollectionConfig } from '@typewav/types';

export const gamingCollection: CollectionConfig = {
  id: 'gaming',
  name: 'Gaming',
  nameEn: 'Gaming',
  description:
    'Phrases et paragraphes inspirés de la culture du jeu vidéo — originaux TypeWav.',
  language: 'multi',
  recommendedTheme: 'arcade',
  recommendedSoundPack: 'chiptune',
  isPremium: false,
  texts: [
    {
      id: 'gam-fr-01',
      content:
        'Le compteur XP grimpe. Chaque frappe juste ajoute un point. Chaque erreur efface une vie. La console ne ment jamais.',
      source: 'TypeWav — Texte original',
      difficulty: 'easy',
      language: 'fr',
      tags: ['gaming', 'arcade', 'xp'],
    },
    {
      id: 'gam-fr-02',
      content:
        'Respawn dans trois secondes. Le boss attend au niveau suivant. Tu as quinze points de vie et un seul sort magique restant.',
      source: 'TypeWav — Texte original',
      difficulty: 'medium',
      language: 'fr',
      tags: ['rpg', 'boss', 'vie'],
    },
    {
      id: 'gam-fr-03',
      content:
        'Speedrun en cours. Le record mondial est à deux minutes quarante-trois. La hitbox était imprécise mais le saut passait quand même.',
      source: 'TypeWav — Texte original',
      difficulty: 'hard',
      language: 'fr',
      tags: ['speedrun', 'record', 'plateforme'],
    },
    {
      id: 'gam-fr-04',
      content:
        'Pixel art, huit couleurs, quatre bits de son. La limitation était une contrainte créative. La contrainte était une invitation.',
      source: 'TypeWav — Texte original',
      difficulty: 'medium',
      language: 'fr',
      tags: ['pixel art', 'retro', '8-bit'],
    },
    {
      id: 'gam-fr-05',
      content:
        "Le lag input rend chaque frame incertaine. Un ping élevé est l'ennemi du joueur compétitif. La connexion, c'est le fondement.",
      source: 'TypeWav — Texte original',
      difficulty: 'hard',
      language: 'fr',
      tags: ['online', 'compétitif', 'réseau'],
    },
    {
      id: 'gam-fr-06',
      content:
        'Inventaire plein. Droppez un objet pour en ramasser un autre. Le choix est cruel quand tout est rare.',
      source: 'TypeWav — Texte original',
      difficulty: 'easy',
      language: 'fr',
      tags: ['rpg', 'inventaire', 'loot'],
    },
    {
      id: 'gam-fr-07',
      content:
        "Le monde ouvert s'étend à l'infini. Les quêtes secondaires s'accumulent. L'histoire principale attend que tu aies le courage de la finir.",
      source: 'TypeWav — Texte original',
      difficulty: 'hard',
      language: 'fr',
      tags: ['open world', 'quête', 'narration'],
    },
    {
      id: 'gam-fr-08',
      content:
        'Roguelike : chaque mort efface la partie. Chaque partie enseigne quelque chose. La progression réelle se fait dans la mémoire du joueur.',
      source: 'TypeWav — Texte original',
      difficulty: 'hard',
      language: 'fr',
      tags: ['roguelike', 'mort', 'progression'],
    },
    {
      id: 'gam-fr-09',
      content:
        "La cartouche souffle. Trois fois. La console redémarre. L'écran s'illumine. Tout recommence, comme si de rien n'était.",
      source: 'TypeWav — Texte original',
      difficulty: 'easy',
      language: 'fr',
      tags: ['retro', 'cartouche', 'nostalgie'],
    },
    {
      id: 'gam-fr-10',
      content:
        "Combo x32. Le multiplicateur explose. La musique s'accélère. Les doigts ne suivent plus. C'est exactement comme ça que ça devrait se terminer.",
      source: 'TypeWav — Texte original',
      difficulty: 'hard',
      language: 'fr',
      tags: ['combo', 'rythme', 'arcade'],
    },
    {
      id: 'gam-en-01',
      content:
        'Insert coin to continue. Ten seconds on the clock. High score belongs to a stranger who played here once and never came back.',
      source: 'TypeWav — Original text',
      difficulty: 'medium',
      language: 'en',
      tags: ['arcade', 'coin-op', 'high score'],
    },
    {
      id: 'gam-en-02',
      content:
        'Save file corrupted. Forty hours of progress gone in a single power outage. The world was already memorized anyway.',
      source: 'TypeWav — Original text',
      difficulty: 'hard',
      language: 'en',
      tags: ['save', 'loss', 'memory'],
    },
    {
      id: 'gam-en-03',
      content:
        'Permadeath means every decision matters. Every corridor, every enemy, every item found on the floor of a dungeon.',
      source: 'TypeWav — Original text',
      difficulty: 'medium',
      language: 'en',
      tags: ['permadeath', 'roguelike', 'dungeon'],
    },
    {
      id: 'gam-en-04',
      content:
        'The frame rate drops to twenty. The physics engine panics. Three NPCs phase through a wall and disappear into the void.',
      source: 'TypeWav — Original text',
      difficulty: 'hard',
      language: 'en',
      tags: ['bugs', 'physics', 'npc'],
    },
    {
      id: 'gam-en-05',
      content:
        'Side-scrolling at sixty frames per second. Eight enemies incoming from the right. Jump timing is everything. Always was.',
      source: 'TypeWav — Original text',
      difficulty: 'medium',
      language: 'en',
      tags: ['platformer', 'timing', 'side-scroll'],
    },
    {
      id: 'gam-en-06',
      content:
        'The tutorial ends. The game begins. Nobody told you the real rules. You learn them one respawn at a time.',
      source: 'TypeWav — Original text',
      difficulty: 'easy',
      language: 'en',
      tags: ['tutorial', 'learning', 'game design'],
    },
    {
      id: 'gam-en-07',
      content:
        'Loot drop rate: zero point one percent. Forty-seven hours of grinding. Still no legendary item. This is also a game.',
      source: 'TypeWav — Original text',
      difficulty: 'hard',
      language: 'en',
      tags: ['loot', 'grind', 'rng', 'mmo'],
    },
    {
      id: 'gam-en-08',
      content:
        'The final boss has three phases. Each phase harder than the last. You already memorized the pattern. You have done this before.',
      source: 'TypeWav — Original text',
      difficulty: 'medium',
      language: 'en',
      tags: ['boss', 'pattern', 'final'],
    },
    {
      id: 'gam-en-09',
      content:
        'Modders rebuilt the entire engine in two years. The original developers left. The community stayed. That is how games survive.',
      source: 'TypeWav — Original text',
      difficulty: 'hard',
      language: 'en',
      tags: ['modding', 'community', 'preservation'],
    },
    {
      id: 'gam-en-10',
      content:
        'Cheat code entered. Invincibility activated. The game becomes trivial. And somehow less fun. That was always the lesson.',
      source: 'TypeWav — Original text',
      difficulty: 'medium',
      language: 'en',
      tags: ['cheat', 'difficulty', 'design'],
    },
  ],
};
