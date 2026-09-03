import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Garde : la hauteur reservee par GlobalNav ne doit jamais etre figee dans un
 * composant (WS-1, layout fluide). Elle vit dans une seule variable CSS,
 * --nav-height, avec un override mobile.
 */

const webRoot = join(__dirname, '..', '..');

function tsxFiles(...dirs: string[]): string[] {
  const out: string[] = [];
  for (const dir of dirs) {
    for (const entry of readdirSync(join(webRoot, dir), {
      recursive: true,
      withFileTypes: true,
    })) {
      if (
        entry.isFile() &&
        entry.name.endsWith('.tsx') &&
        !entry.parentPath.includes('__tests__')
      ) {
        out.push(join(entry.parentPath, entry.name));
      }
    }
  }
  return out;
}

describe('--nav-height', () => {
  const css = readFileSync(join(webRoot, 'styles', 'globals.css'), 'utf8');

  it('est defini dans globals.css avec un override mobile', () => {
    const definitions = css.match(/--nav-height:\s*\d+px/g) ?? [];
    expect(definitions.length).toBeGreaterThanOrEqual(2);
    expect(css).toMatch(/@media[^{]*max-width[^{]*\{[^}]*--nav-height/s);
  });

  it("aucun composant ne fige la hauteur de la nav avec un px en dur", () => {
    const offenders = tsxFiles('app', 'components')
      .filter((f) => /calc\(100d?vh\s*-\s*\d+px\)/.test(readFileSync(f, 'utf8')))
      .map((f) => f.replace(webRoot, 'apps/web'));
    expect(offenders).toEqual([]);
  });

  it('les pages plein-viewport referencent le token', () => {
    const homeClient = readFileSync(
      join(webRoot, 'components', 'typing', 'HomeClient.tsx'),
      'utf8',
    );
    expect(homeClient).toContain('calc(100dvh - var(--nav-height))');
  });
});
