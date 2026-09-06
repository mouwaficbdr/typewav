import { describe, expect, it } from 'vitest';

import {
  APP_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_DESCRIPTION_FR,
  buildMetadata,
} from '../seo';

describe('buildMetadata', () => {
  it('canonical FR pointe vers /fr, jamais la racine nue', () => {
    expect(buildMetadata({ locale: 'fr' }).alternates?.canonical).toBe(
      `${APP_URL}/fr`,
    );
  });

  it('canonical EN pointe vers /en', () => {
    expect(buildMetadata({ locale: 'en' }).alternates?.canonical).toBe(
      `${APP_URL}/en`,
    );
  });

  it('déclare les alternates hreflang fr, en et x-default', () => {
    const langs = buildMetadata({ locale: 'fr' }).alternates?.languages ?? {};
    expect(langs).toMatchObject({
      fr: `${APP_URL}/fr`,
      en: `${APP_URL}/en`,
      'x-default': `${APP_URL}/fr`,
    });
  });

  it("les aperçus OG et Twitter suivent la langue de la page, pas toujours l'anglais", () => {
    const m = buildMetadata({
      locale: 'fr',
      title: 'Titre FR',
      description: 'Description FR',
    });
    expect(JSON.stringify(m.openGraph)).toContain('Titre FR');
    expect(JSON.stringify(m.openGraph)).toContain('Description FR');
    expect(JSON.stringify(m.twitter)).toContain('Titre FR');
  });

  it('ne référence aucune image /og-image.png inexistante', () => {
    const m = buildMetadata({ locale: 'fr' });
    expect(JSON.stringify(m)).not.toContain('og-image.png');
  });

  it("laisse la convention opengraph-image agir (pas d'images explicites dans openGraph)", () => {
    const og = buildMetadata({ locale: 'fr' }).openGraph;
    expect(og && 'images' in og).toBe(false);
  });

  it('openGraph.url reflète la locale', () => {
    expect(JSON.stringify(buildMetadata({ locale: 'en' }).openGraph)).toContain(
      `${APP_URL}/en`,
    );
  });

  it('sans locale, retombe sur la locale par défaut (fr)', () => {
    expect(buildMetadata().alternates?.canonical).toBe(`${APP_URL}/fr`);
  });

  it('le titre par défaut par locale est court et sans marque : le gabarit ajoute « typewav | »', () => {
    // Sinon le gabarit du layout racine double la marque :
    // « typewav | typewav | Musical typing test ».
    const en = buildMetadata({ locale: 'en' }).title;
    const fr = buildMetadata({ locale: 'fr' }).title;
    expect(en).toMatchObject({ default: 'Musical typing test' });
    expect(fr).toMatchObject({ default: 'Test de frappe musical' });
    expect(JSON.stringify(en)).not.toContain('typewav | typewav');
  });

  it('sans locale ni titre, garde le titre de marque complet comme repli racine', () => {
    expect(buildMetadata().title).toMatchObject({
      default: 'typewav | Musical typing test',
    });
  });

  it("titre = marque nue : `absolute`, pour que le gabarit ne double pas « typewav | typewav »", () => {
    expect(buildMetadata({ locale: 'fr', title: 'typewav' }).title).toMatchObject(
      { absolute: 'typewav' },
    );
  });

  it("la description par défaut suit la langue de la page : accroche FR sur /fr, EN sur /en", () => {
    expect(buildMetadata({ locale: 'fr' }).description).toBe(
      DEFAULT_DESCRIPTION_FR,
    );
    expect(buildMetadata({ locale: 'en' }).description).toBe(DEFAULT_DESCRIPTION);
    // Accroche courte façon Monkeytype, pas un paragraphe.
    expect(DEFAULT_DESCRIPTION).toBe('A musical, customizable typing test.');
    expect(DEFAULT_DESCRIPTION_FR).toBe(
      'Un test de frappe musical et personnalisable.',
    );
  });

  it("ne positionne plus TypeWav comme de la « musicothérapie » nulle part dans les métadonnées", () => {
    const dump = JSON.stringify([
      buildMetadata({ locale: 'fr' }),
      buildMetadata({ locale: 'en' }),
      buildMetadata(),
    ]).toLowerCase();
    expect(dump).not.toContain('musicoth');
    expect(dump).not.toContain('therap');
  });

  it("APP_URL n'est plus le placeholder mort typewav.app", () => {
    expect(APP_URL).not.toContain('typewav.app');
  });
});
