/**
 * Collection Poésie — textes du domaine public (auteur mort > 70 ans).
 * Sources : Wikisource, Project Gutenberg.
 * Spec : docs/specs/06-content.md
 */

import type { CollectionConfig } from '@typewav/types';

export const poesieCollection: CollectionConfig = {
  id: 'poesie',
  name: 'Poésie',
  nameEn: 'Poetry',
  description: 'Poèmes emblématiques du patrimoine mondial — domaine public.',
  language: 'multi',
  recommendedTheme: 'midnight-sun',
  recommendedSoundPack: 'piano',
  isPremium: false,
  texts: [
    {
      id: 'poe-fr-01',
      content:
        "Mon enfant, ma sœur, songe à la douceur d'aller là-bas vivre ensemble.",
      source: "Charles Baudelaire — L'Invitation au voyage (1857)",
      difficulty: 'medium',
      language: 'fr',
      tags: ['baudelaire', 'romantisme', 'france'],
    },
    {
      id: 'poe-fr-02',
      content:
        "Demain, dès l'aube, à l'heure où blanchit la campagne, je partirai. Vois-tu, je sais que tu m'attends.",
      source: 'Victor Hugo — Les Contemplations (1856)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['hugo', 'romantisme', 'france'],
    },
    {
      id: 'poe-fr-03',
      content:
        "Sous le pont Mirabeau coule la Seine et nos amours faut-il qu'il m'en souvienne la joie venait toujours après la peine.",
      source: 'Guillaume Apollinaire — Le Pont Mirabeau (1913)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['apollinaire', 'modernisme', 'france'],
    },
    {
      id: 'poe-fr-04',
      content:
        'Heureux qui, comme Ulysse, a fait un beau voyage, ou comme cestuy-là qui conquit la toison.',
      source: 'Joachim du Bellay — Les Regrets (1558)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['du bellay', 'renaissance', 'france'],
    },
    {
      id: 'poe-fr-05',
      content:
        'Sois sage, ô ma Douleur, et tiens-toi plus tranquille. Tu réclamais le Soir; il descend; le voici.',
      source: 'Charles Baudelaire — Recueillement (1861)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['baudelaire', 'symbolisme', 'france'],
    },
    {
      id: 'poe-fr-06',
      content:
        'Il pleure dans mon cœur comme il pleut sur la ville. Quelle est cette langueur qui pénètre mon cœur?',
      source: 'Paul Verlaine — Romances sans paroles (1874)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['verlaine', 'symbolisme', 'france'],
    },
    {
      id: 'poe-fr-07',
      content:
        "Ma bohème. Je m'en allais, les poings dans mes poches crevées; mon paletot aussi devenait idéal.",
      source: 'Arthur Rimbaud — Ma Bohème (1870)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['rimbaud', 'symbolisme', 'france'],
    },
    {
      id: 'poe-fr-08',
      content:
        'La terre est bleue comme une orange. Jamais une erreur les mots ne mentent pas.',
      source: "Paul Éluard — L'Amour la Poésie (1929)",
      difficulty: 'easy',
      language: 'fr',
      tags: ['eluard', 'surréalisme', 'france'],
    },
    {
      id: 'poe-fr-09',
      content:
        "Liberté. J'ai écrit ton nom sur mes cahiers d'écolier sur mon pupitre et les arbres.",
      source: 'Paul Éluard — Liberté (1942)',
      difficulty: 'easy',
      language: 'fr',
      tags: ['eluard', 'résistance', 'france'],
    },
    {
      id: 'poe-fr-10',
      content:
        "Qui fait l'ange fait la bête. Le cœur a ses raisons que la raison ne connaît point.",
      source: 'Blaise Pascal — Pensées (1670)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['pascal', 'philosophie', 'france'],
    },
    {
      id: 'poe-en-01',
      content:
        "Shall I compare thee to a summer's day? Thou art more lovely and more temperate.",
      source: 'William Shakespeare — Sonnet 18 (1609)',
      difficulty: 'medium',
      language: 'en',
      tags: ['shakespeare', 'sonnet', 'england'],
    },
    {
      id: 'poe-en-02',
      content:
        'Two roads diverged in a yellow wood, and sorry I could not travel both and be one traveler.',
      source: 'Robert Frost — The Road Not Taken (1916)',
      difficulty: 'easy',
      language: 'en',
      tags: ['frost', 'american', 'nature'],
    },
    {
      id: 'poe-en-03',
      content:
        'Do not go gentle into that good night. Old age should burn and rave at close of day.',
      source: 'Dylan Thomas — Do Not Go Gentle (1947)',
      difficulty: 'medium',
      language: 'en',
      tags: ['thomas', 'villanelle', 'wales'],
    },
    {
      id: 'poe-en-04',
      content:
        'Because I could not stop for Death, he kindly stopped for me; the carriage held but just ourselves and Immortality.',
      source: 'Emily Dickinson — Because I Could Not Stop for Death (c.1863)',
      difficulty: 'medium',
      language: 'en',
      tags: ['dickinson', 'american', 'death'],
    },
    {
      id: 'poe-en-05',
      content: 'I have measured out my life with coffee spoons.',
      source: 'T.S. Eliot — The Love Song of J. Alfred Prufrock (1915)',
      difficulty: 'easy',
      language: 'en',
      tags: ['eliot', 'modernism', 'american'],
    },
    {
      id: 'poe-en-06',
      content:
        'In Xanadu did Kubla Khan a stately pleasure-dome decree: where Alph, the sacred river, ran through caverns measureless to man down to a sunless sea.',
      source: 'Samuel Taylor Coleridge — Kubla Khan (1816)',
      difficulty: 'hard',
      language: 'en',
      tags: ['coleridge', 'romanticism', 'england'],
    },
    {
      id: 'poe-en-07',
      content:
        'Hope is the thing with feathers that perches in the soul, and sings the tune without the words, and never stops at all.',
      source: 'Emily Dickinson — Hope is the Thing with Feathers (c.1861)',
      difficulty: 'easy',
      language: 'en',
      tags: ['dickinson', 'american', 'hope'],
    },
    {
      id: 'poe-en-08',
      content:
        'Tyger Tyger, burning bright, in the forests of the night; what immortal hand or eye, could frame thy fearful symmetry?',
      source: 'William Blake — Songs of Experience (1794)',
      difficulty: 'medium',
      language: 'en',
      tags: ['blake', 'romanticism', 'england'],
    },
    {
      id: 'poe-en-09',
      content:
        "I wandered lonely as a cloud that floats on high o'er vales and hills, when all at once I saw a crowd, a host, of golden daffodils.",
      source: 'William Wordsworth — Daffodils (1807)',
      difficulty: 'medium',
      language: 'en',
      tags: ['wordsworth', 'romanticism', 'nature'],
    },
    {
      id: 'poe-en-10',
      content:
        'The fog comes on little cat feet. It sits looking over harbor and city on silent haunches and then moves on.',
      source: 'Carl Sandburg — Fog (1916)',
      difficulty: 'easy',
      language: 'en',
      tags: ['sandburg', 'american', 'imagism'],
    },
  ],
};
