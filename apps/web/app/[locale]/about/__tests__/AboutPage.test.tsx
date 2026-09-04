import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import frMessages from '@/messages/fr.json';

// Traducteur réel sur le namespace `about` de fr.json : les assertions portent
// sur le vrai contenu, pas sur des clés opaques.
const about = frMessages.about as Record<string, unknown>;
function lookup(key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], about);
  return typeof value === 'string' ? value : key;
}

vi.mock('next-intl/server', () => {
  const t = (key: string) => lookup(key);
  t.rich = (key: string, tags: Record<string, (chunks: ReactNode) => ReactNode>) => {
    const raw = lookup(key);
    const match = raw.match(/^(.*)<([a-zA-Z]+)>(.*)<\/\2>(.*)$/s);
    if (!match) return raw;
    const [, before, tag, inner, after] = match;
    return (
      <>
        {before}
        {tags[tag!]?.(inner)}
        {after}
      </>
    );
  };
  return { getTranslations: async () => t };
});

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import AboutPage from '../page';

async function renderPage(locale = 'fr') {
  const ui = await AboutPage({ params: Promise.resolve({ locale }) });
  return render(ui);
}

describe('AboutPage', () => {
  it('affiche le masthead comme unique titre de niveau 1', async () => {
    await renderPage();
    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent('Tape juste. La note tombe.');
  });

  it('rend les huit rubriques numérotées de 01 à 08', async () => {
    await renderPage();
    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent);
    expect(headings).toEqual([
      'Le manifeste',
      'La musique',
      'Les modes',
      'Le corpus',
      "Local d'abord, sans compte",
      'Raccourcis clavier',
      'Glossaire',
      'Liens',
    ]);
    for (const n of ['01', '02', '03', '04', '05', '06', '07', '08']) {
      expect(screen.getByText(n)).toBeInTheDocument();
    }
  });

  it('liste les huit modes avec leur nom', async () => {
    await renderPage();
    const modesSection = screen
      .getAllByRole('heading', { level: 2 })
      .find((h) => h.textContent === 'Les modes')!
      .closest('section')!;
    for (const name of [
      'Temps',
      'Mots',
      'Citation',
      'Zen',
      'Code',
      'Apprentissage',
      'Fantôme',
      'Libre',
    ]) {
      expect(within(modesSection).getByText(name)).toBeInTheDocument();
    }
  });

  it('énonce la règle produit : une faute ne joue rien', async () => {
    await renderPage();
    expect(
      screen.getByText(/Jamais de fausse note, seulement du silence/i),
    ).toBeInTheDocument();
  });

  it('rend les raccourcis avec de vraies touches <kbd>', async () => {
    await renderPage();
    const keycaps = document.querySelectorAll('kbd');
    const legends = Array.from(keycaps).map((k) => k.textContent);
    expect(legends).toContain('Tab');
    expect(legends).toContain('↵');
    expect(legends).toContain('⌫');
    expect(legends).toContain('Échap');
  });

  it('pointe le lien local-first vers les paramètres de la locale de route', async () => {
    // Le traducteur mocké est fr : le libellé reste "paramètres" ; c'est le
    // href qui doit suivre la locale résolue depuis params.
    await renderPage('en');
    const settingsLink = screen.getByRole('link', { name: 'paramètres' });
    expect(settingsLink).toHaveAttribute('href', '/en/parametres');
  });

  it('renvoie vers le code source GitHub et la page transparence', async () => {
    await renderPage();
    expect(
      screen.getByRole('link', { name: /Code source sur GitHub/i }),
    ).toHaveAttribute('href', 'https://github.com/mouwaficbdr/typewav');
    expect(
      screen.getByRole('link', { name: /Transparence et conditions/i }),
    ).toHaveAttribute('href', '/fr/transparence');
  });

  it('ferme sur un retour vers le clavier', async () => {
    await renderPage();
    const closing = screen.getByRole('link', {
      name: /Assez lu\. Retour au clavier\./i,
    });
    expect(closing).toHaveAttribute('href', '/fr');
  });

  it('ne contient aucune section dons ou soutien', async () => {
    await renderPage();
    expect(screen.queryByText(/ko-fi/i)).toBeNull();
    expect(screen.queryByText(/sponsor/i)).toBeNull();
    expect(screen.queryByText(/faire un don/i)).toBeNull();
  });

  it('rend un glossaire avec les quatre métriques', async () => {
    await renderPage();
    const glossary = screen
      .getAllByRole('heading', { level: 2 })
      .find((h) => h.textContent === 'Glossaire')!
      .closest('section')!;
    for (const term of ['WPM', 'WPM net', 'Précision', 'Régularité']) {
      expect(within(glossary).getByText(term)).toBeInTheDocument();
    }
  });
});
