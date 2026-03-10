/**
 * Collection Littérature — textes du domaine public (auteur mort > 70 ans).
 * Sources : Project Gutenberg, Wikisource.
 * Spec : docs/specs/06-content.md
 */

import type { CollectionConfig } from '@typewav/types';

export const litteratureCollection: CollectionConfig = {
  id: 'litterature',
  name: 'Littérature',
  nameEn: 'Literature',
  description: 'Grands textes de la littérature mondiale — domaine public.',
  language: 'multi',
  recommendedTheme: 'noir',
  recommendedSoundPack: 'piano',
  isPremium: false,
  texts: [
    // ── Français ──────────────────────────────────────────────────────────────
    {
      id: 'lit-fr-01',
      content:
        'Il était une fois un petit prince qui habitait une planète à peine plus grande que lui.',
      source: 'Antoine de Saint-Exupéry — Le Petit Prince (1943)',
      difficulty: 'easy',
      language: 'fr',
      tags: ['classique', 'français', 'conte'],
    },
    {
      id: 'lit-fr-02',
      content:
        "Longtemps, je me suis couché de bonne heure. Parfois, à peine ma bougie éteinte, mes yeux se fermaient si vite que je n'avais pas le temps de me dire : «Je m'endors.»",
      source: 'Marcel Proust — Du côté de chez Swann (1913)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['classique', 'français', 'roman'],
    },
    {
      id: 'lit-fr-03',
      content:
        "Aujourd'hui, maman est morte. Ou peut-être hier, je ne sais pas. J'ai reçu un télégramme de l'asile : «Mère décédée. Enterrement demain. Sentiments distingués.»",
      source: "Albert Camus — L'Étranger (1942)",
      difficulty: 'medium',
      language: 'fr',
      tags: ['classique', 'français', 'roman'],
    },
    {
      id: 'lit-fr-04',
      content:
        'Toutes les familles heureuses se ressemblent ; chaque famille malheureuse est malheureuse à sa façon.',
      source: 'Léon Tolstoï — Anna Karénine (1877)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['classique', 'russe', 'roman'],
    },
    {
      id: 'lit-fr-05',
      content:
        'La nuit était sombre et orageuse. Raskolnikov se leva et sortit de sa mansarde.',
      source: 'Fiodor Dostoïevski — Crime et Châtiment (1866)',
      difficulty: 'easy',
      language: 'fr',
      tags: ['classique', 'russe', 'roman'],
    },
    {
      id: 'lit-fr-06',
      content:
        "Dans un trou dans le sol vivait un hobbit. Ce n'était pas un trou désagréable, sale et humide, rempli de bouts de vers et d'une odeur de boue.",
      source: 'J.R.R. Tolkien — Le Hobbit (1937)',
      difficulty: 'easy',
      language: 'fr',
      tags: ['fantaisie', 'classique', 'roman'],
    },
    {
      id: 'lit-fr-07',
      content:
        "C'était le meilleur des temps, c'était le pire des temps, c'était l'âge de la sagesse, c'était l'âge de la folie.",
      source: 'Charles Dickens — Le Conte de deux villes (1859)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['classique', 'anglais', 'historique'],
    },
    {
      id: 'lit-fr-08',
      content:
        'Je suis un homme invisible. Non, je ne suis pas un fantôme comme ceux qui hantent Edgar Poe.',
      source: 'Ralph Ellison — Invisible Man (1952)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['américain', 'roman'],
    },
    {
      id: 'lit-fr-09',
      content:
        "La grandeur d'un métier est peut-être, avant tout, d'unir des hommes. Il n'est qu'un luxe véritable et c'est celui des relations humaines.",
      source: 'Antoine de Saint-Exupéry — Terre des Hommes (1939)',
      difficulty: 'hard',
      language: 'fr',
      tags: ['classique', 'français', 'essai'],
    },
    {
      id: 'lit-fr-10',
      content:
        "La vie est courte et l'art est long, l'occasion fugitive, l'expérience trompeuse, le jugement difficile.",
      source: 'Hippocrate — Aphorismes (IVe siècle av. J.-C.)',
      difficulty: 'medium',
      language: 'fr',
      tags: ['philosophie', 'antiquité'],
    },
    // ── English ───────────────────────────────────────────────────────────────
    {
      id: 'lit-en-01',
      content:
        'Call me Ishmael. Some years ago — never mind how long precisely — having little money in my purse, I thought I would sail about a little and see the watery part of the world.',
      source: 'Herman Melville — Moby-Dick (1851)',
      difficulty: 'hard',
      language: 'en',
      tags: ['classic', 'american', 'novel'],
    },
    {
      id: 'lit-en-02',
      content:
        'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.',
      source: 'Charles Dickens — A Tale of Two Cities (1859)',
      difficulty: 'medium',
      language: 'en',
      tags: ['classic', 'english', 'novel'],
    },
    {
      id: 'lit-en-03',
      content:
        'Whether I shall turn out to be the hero of my own life, or whether that station will be held by anybody else, these pages must show.',
      source: 'Charles Dickens — David Copperfield (1850)',
      difficulty: 'medium',
      language: 'en',
      tags: ['classic', 'english', 'novel'],
    },
    {
      id: 'lit-en-04',
      content:
        'Happy families are all alike; every unhappy family is unhappy in its own way.',
      source: 'Leo Tolstoy — Anna Karenina (1877)',
      difficulty: 'easy',
      language: 'en',
      tags: ['classic', 'russian', 'novel'],
    },
    {
      id: 'lit-en-05',
      content:
        'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
      source: 'Jane Austen — Pride and Prejudice (1813)',
      difficulty: 'medium',
      language: 'en',
      tags: ['classic', 'english', 'novel'],
    },
    {
      id: 'lit-en-06',
      content:
        'So we beat on, boats against the current, borne back ceaselessly into the past.',
      source: 'F. Scott Fitzgerald — The Great Gatsby (1925)',
      difficulty: 'medium',
      language: 'en',
      tags: ['classic', 'american', 'novel'],
    },
    {
      id: 'lit-en-07',
      content:
        'In the beginning God created the heavens and the earth. Now the earth was formless and empty, darkness was over the surface of the deep.',
      source: 'Genesis 1:1 — King James Bible (1611)',
      difficulty: 'easy',
      language: 'en',
      tags: ['classic', 'religious', 'poetry'],
    },
    {
      id: 'lit-en-08',
      content:
        "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
      source: 'William Shakespeare — Hamlet (1603)',
      difficulty: 'hard',
      language: 'en',
      tags: ['classic', 'english', 'drama'],
    },
    {
      id: 'lit-en-09',
      content:
        'All animals are equal, but some animals are more equal than others.',
      source: 'George Orwell — Animal Farm (1945)',
      difficulty: 'easy',
      language: 'en',
      tags: ['classic', 'english', 'satire'],
    },
    {
      id: 'lit-en-10',
      content:
        'It was a bright cold day in April, and the clocks were striking thirteen.',
      source: 'George Orwell — Nineteen Eighty-Four (1949)',
      difficulty: 'easy',
      language: 'en',
      tags: ['classic', 'english', 'dystopia'],
    },
  ],
};
