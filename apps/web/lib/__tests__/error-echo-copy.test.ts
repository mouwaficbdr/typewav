import { describe, it, expect } from 'vitest';
import fr from '../../messages/fr.json';
import en from '../../messages/en.json';

/**
 * Une faute ne joue jamais de fausse note : la musique s'arrête et la
 * dernière note résonne tout bas (l'écho, `triggerErrorEcho`). Ce n'est pas
 * du silence. Aucun texte ne doit plus dire le contraire (ticket #129).
 */
describe('textes : une faute fait résonner la dernière note, jamais le silence', () => {
  for (const [lang, msgs] of [
    ['fr', fr],
    ['en', en],
  ] as const) {
    it(`${lang} : aucun texte ne décrit une faute comme silencieuse`, () => {
      const all = JSON.stringify(msgs);
      expect(all).not.toMatch(
        /reste silencieuse|ne joue rien|seulement du silence|stays silent|plays nothing|only silence/i,
      );
    });
  }
});
