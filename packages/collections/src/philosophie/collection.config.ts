/**
 * Collection Philosophie — extraits du domaine public (auteurs morts > 70 ans).
 * Sources : Wikisource, Project Gutenberg, traductions classiques.
 * Spec : docs/specs/06-content.md
 */

import type { CollectionConfig } from '@typewav/types';

export const philosophieCollection: CollectionConfig = {
  id: 'philosophie',
  name: 'Philosophie',
  nameEn: 'Philosophy',
  description:
    'Fragments de la pensée universelle — Descartes, Pascal, Nietzsche et leurs pairs.',
  language: 'multi',
  recommendedTheme: 'noir',
  recommendedSoundPack: 'piano',
  isPremium: false,
  texts: [
    {
      id: 'phi-fr-01',
      content:
        "Je pense, donc je suis. Cette vérité est si ferme et si assurée que toutes les plus extravagantes suppositions des sceptiques ne sont pas capables de l'ébranler.",
      source: 'René Descartes — Discours de la méthode (1637)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['descartes', 'rationalisme', 'cogito'],
    },
    {
      id: 'phi-fr-02',
      content:
        'Le cœur a ses raisons que la raison ne connaît point. On le sait en mille choses.',
      source: 'Blaise Pascal — Pensées (1670)',
      difficulty: 'easy',
      language: 'fr',
      tags: ['pascal', 'raison', 'cœur'],
    },
    {
      id: 'phi-fr-03',
      content:
        "L'homme est né libre, et partout il est dans les fers. Tel se croit le maître des autres qui ne laisse pas d'être plus esclave qu'eux.",
      source: 'Jean-Jacques Rousseau — Du Contrat social (1762)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['rousseau', 'liberté', 'contrat social'],
    },
    {
      id: 'phi-fr-04',
      content:
        "Si Dieu n'existait pas, il faudrait l'inventer. Mais toute la nature nous crie qu'il existe.",
      source:
        "Voltaire — Épître à l'auteur du livre des Trois Imposteurs (1769)",
      difficulty: 'medium',
      language: 'fr',
      tags: ['voltaire', 'déisme', 'raison'],
    },
    {
      id: 'phi-fr-05',
      content:
        "Que sais-je ? Cette belle parole est la devise du scepticisme, et c'est aussi la devise de toute philosophie.",
      source: 'Michel de Montaigne — Essais (1580)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['montaigne', 'scepticisme', 'essais'],
    },
    {
      id: 'phi-fr-06',
      content:
        'Ce qui nous trouble, ce ne sont pas les événements, mais les opinions que nous avons des événements.',
      source: 'Épictète — Manuel (vers 125 ap. J.-C., trad. classique)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['épictète', 'stoïcisme', 'opinion'],
    },
    {
      id: 'phi-fr-07',
      content:
        "Il n'y a qu'une seule chose vraiment sérieuse en philosophie : savoir si la vie vaut ou ne vaut pas la peine d'être vécue.",
      source: 'Albert Camus — Le Mythe de Sisyphe (1942)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['camus', 'absurde', 'existentialisme'],
    },
    {
      id: 'phi-fr-08',
      content:
        "Dieu est mort. Dieu reste mort. Et c'est nous qui l'avons tué. Comment nous consoler, nous les meurtriers des meurtriers ?",
      source: 'Friedrich Nietzsche — Le Gai Savoir (1882)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['nietzsche', 'nihilisme', 'modernité'],
    },
    {
      id: 'phi-fr-09',
      content:
        'La vie doit être comprise à rebours, mais elle doit être vécue en avant. Telle est la condition de ceux qui réfléchissent.',
      source: 'Søren Kierkegaard — Journal (vers 1843)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['kierkegaard', 'existence', 'temps'],
    },
    {
      id: 'phi-fr-10',
      content:
        "Agis seulement d'après la maxime grâce à laquelle tu peux vouloir en même temps qu'elle devienne une loi universelle.",
      source: 'Emmanuel Kant — Fondation de la métaphysique des mœurs (1785)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['kant', 'impératif catégorique', 'éthique'],
    },
    {
      id: 'phi-fr-11',
      content:
        'Nous ne cherchons pas seulement à connaître ce que les philosophes ont pensé, mais aussi ce que pensent les choses elles-mêmes.',
      source: 'Aristote — Métaphysique (IVe siècle av. J.-C., trad. classique)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['aristote', 'métaphysique', 'vérité'],
    },
    {
      id: 'phi-fr-12',
      content:
        "Une vie sans examen ne vaut pas la peine d'être vécue pour un homme.",
      source:
        'Socrate — cité par Platon, Apologie (399 av. J.-C., trad. classique)',
      difficulty: 'easy',
      language: 'fr',
      tags: ['socrate', 'platon', 'vertu'],
    },
    {
      id: 'phi-en-01',
      content:
        "To be or not to be, that is the question: whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
      source: 'William Shakespeare — Hamlet (1603)',
      difficulty: 'medium',
      language: 'en',
      tags: ['shakespeare', 'existence', 'theatre'],
    },
    {
      id: 'phi-en-02',
      content:
        'The unexamined life is not worth living. We must care for our soul before we care for our body or our wealth.',
      source: 'Plato — Apology (399 BC, classical translation)',
      difficulty: 'medium',
      language: 'en',
      tags: ['plato', 'socrates', 'virtue'],
    },
    {
      id: 'phi-en-03',
      content:
        'Man is by nature a political animal. Outside of society he is either a beast or a god.',
      source: 'Aristotle — Politics (350 BC, classical translation)',
      difficulty: 'medium',
      language: 'en',
      tags: ['aristotle', 'politics', 'nature'],
    },
    {
      id: 'phi-en-04',
      content:
        'Knowledge is power. Reading maketh a full man, conference a ready man, and writing an exact man.',
      source: 'Francis Bacon — Essays (1597)',
      difficulty: 'easy',
      language: 'en',
      tags: ['bacon', 'knowledge', 'empiricism'],
    },
    {
      id: 'phi-en-05',
      content:
        "I think, therefore I am. The only things in life you regret are the risks you didn't take.",
      source: 'René Descartes — Discourse on the Method (1637)',
      difficulty: 'easy',
      language: 'en',
      tags: ['descartes', 'rationalism', 'cogito'],
    },
    {
      id: 'phi-en-06',
      content:
        "To do as one would be done by, and to love one's neighbour as oneself, constitute the ideal perfection of utilitarian morality.",
      source: 'John Stuart Mill — Utilitarianism (1863)',
      difficulty: 'hard',
      language: 'en',
      tags: ['mill', 'utilitarianism', 'ethics'],
    },
    {
      id: 'phi-en-07',
      content:
        'The life of man, solitary, poor, nasty, brutish, and short. In such condition there is no place for industry.',
      source: 'Thomas Hobbes — Leviathan (1651)',
      difficulty: 'hard',
      language: 'en',
      tags: ['hobbes', 'state of nature', 'politics'],
    },
    {
      id: 'phi-en-08',
      content:
        'God is dead. We have killed him. How shall we comfort ourselves, the murderers of all murderers?',
      source: 'Friedrich Nietzsche — The Gay Science (1882)',
      difficulty: 'medium',
      language: 'en',
      tags: ['nietzsche', 'nihilism', 'modernity'],
    },
    {
      id: 'phi-en-09',
      content:
        'Hell is other people. We are condemned to be free. Existence precedes essence.',
      source: 'Jean-Paul Sartre — No Exit (1944)',
      difficulty: 'easy',
      language: 'en',
      tags: ['sartre', 'existentialism', 'freedom'],
    },
    {
      id: 'phi-en-10',
      content:
        'We are all searching for someone whose demons play well with ours. The mind is its own place and can make a heaven of hell.',
      source: 'John Milton — Paradise Lost (1667)',
      difficulty: 'hard',
      language: 'en',
      tags: ['milton', 'paradise', 'mind'],
    },
  ],
};
