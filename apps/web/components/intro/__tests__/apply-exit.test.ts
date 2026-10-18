import { describe, expect, it } from 'vitest';
import { exitSettings } from '../apply-exit';

describe('exitSettings', () => {
  it('première visite, aucune langue choisie : retombe sur la langue de l’Ouverture, règle le mode 30s', () => {
    expect(
      exitSettings({ chosenLanguage: null, introLanguage: 'fr', firstRun: true }),
    ).toEqual({ textLanguage: 'fr', setTimedMode30: true, localeTarget: 'fr' });
  });

  it('première visite, langue choisie explicitement', () => {
    expect(
      exitSettings({ chosenLanguage: 'en', introLanguage: 'en', firstRun: true }),
    ).toEqual({ textLanguage: 'en', setTimedMode30: true, localeTarget: 'en' });
  });

  it('rejouée, aucune langue choisie : rien ne change', () => {
    expect(
      exitSettings({ chosenLanguage: null, introLanguage: 'fr', firstRun: false }),
    ).toEqual({ textLanguage: null, setTimedMode30: false, localeTarget: null });
  });

  it('rejouée, langue choisie : seule la langue change', () => {
    expect(
      exitSettings({ chosenLanguage: 'en', introLanguage: 'en', firstRun: false }),
    ).toEqual({ textLanguage: 'en', setTimedMode30: false, localeTarget: 'en' });
  });
});
