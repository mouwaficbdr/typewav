import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ThemeConfig } from '@typewav/types';
import {
  arcadeTheme,
  midnightSunTheme,
  noirTheme,
  terminalTheme,
} from '@typewav/themes';
import { describe, expect, it } from 'vitest';
import { APP_THEMES } from '../theme/defaultThemes';

/**
 * Garde de contraste : WCAG 2.2 niveau AA (WS-1).
 *
 * Chaque token de couleur qui porte du texte ou identifie un élément d'UI doit
 * rester au-dessus du seuil lisible, dans TOUS les thèmes livrés, sur les deux
 * fonds (`bg` de page et `surface` de carte).
 *
 * Seuils :
 * - 4.5:1  texte courant (1.4.3). La quasi-totalité du texte de l'app est
 *   entre 0.72rem et 1rem : `textMuted`, `accent` (liens « Se connecter »,
 *   messages de succès), `error` (validation de formulaire) sont du texte
 *   courant.
 * - 3:1    texte large et éléments non textuels (1.4.3 large + 1.4.11). Les
 *   caractères de la zone de frappe sont rendus à 1.75rem (28px > 24px) donc
 *   « large » ; le caret (`cursor`) est le seul indicateur de la position de
 *   frappe.
 *
 * Hors périmètre volontaire : `--color-border`. C'est un filet décoratif
 * (séparateurs, contours de carte). Les bordures qui sont la seule affordance
 * d'un contrôle utilisent déjà `--color-text-muted` (cf. `AuthForm.tsx`, dont
 * le commentaire note un contraste de 5.7:1, conforme à WCAG 1.4.11 AA). Un
 * séparateur décoratif n'identifie aucun composant ni état : 1.4.11 ne s'y
 * applique pas.
 */

// ─── Calcul de contraste WCAG 2.1 ───────────────────────────────────────────────

interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(input: string): Rgb {
  const s = input.trim();
  const hex = s.replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }
  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return {
      r: parseInt(hex[0]! + hex[0]!, 16),
      g: parseInt(hex[1]! + hex[1]!, 16),
      b: parseInt(hex[2]! + hex[2]!, 16),
      a: 1,
    };
  }
  throw new Error(`Couleur non reconnue : ${input}`);
}

/** Compose `fg` (éventuellement semi-transparent) sur un `bg` opaque. */
function compositeOver(fg: Rgb, bg: Rgb): Rgb {
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
}

function channelToLinear(value8bit: number): number {
  const c = value8bit / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color: Rgb): number {
  return (
    0.2126 * channelToLinear(color.r) +
    0.7152 * channelToLinear(color.g) +
    0.0722 * channelToLinear(color.b)
  );
}

/** Ratio de contraste WCAG entre `fg` (composé sur `bg`) et `bg`. */
function contrast(fg: string, bg: string): number {
  const bgRgb = parseColor(bg);
  const fgRgb = compositeOver(parseColor(fg), bgRgb);
  const l1 = relativeLuminance(fgRgb);
  const l2 = relativeLuminance(bgRgb);
  const [light, dark] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

// ─── Sanité du calculateur (valeurs de référence connues) ──────────────────────

describe('calcul de contraste WCAG', () => {
  it('noir sur blanc = 21:1', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('blanc sur blanc = 1:1', () => {
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('#767676 sur blanc ≈ 4.54:1 (limite AA texte courant)', () => {
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });

  it('compose un premier plan semi-transparent avant de mesurer', () => {
    // 50% de blanc sur noir = #808080 opaque ≈ 3.95:1 sur noir.
    expect(contrast('#ffffff80', '#000000')).toBeCloseTo(
      contrast('#808080', '#000000'),
      1,
    );
  });
});

// ─── Palettes auditées ────────────────────────────────────────────────────────

const AA_NORMAL = 4.5;
const AA_LARGE = 3; // texte large (1.4.3) + éléments non textuels (1.4.11)

/** Palette par défaut injectée avant paint, lue depuis le bloc `@theme`. */
function readRootPalette(): Record<string, string> {
  const css = readFileSync(
    join(import.meta.dirname, '..', '..', 'styles', 'globals.css'),
    'utf8',
  );
  const block = css.match(/@theme\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  const out: Record<string, string> = {};
  for (const [, name, value] of block.matchAll(
    /--color-([a-z-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g,
  )) {
    out[name!] = value!;
  }
  return out;
}

const root = readRootPalette();

interface Palette {
  name: string;
  bg: string;
  surface: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  error: string;
  charPending: string;
  charCurrent: string;
  cursor: string;
}

function fromThemeConfig(theme: ThemeConfig): Palette {
  const c = theme.colors;
  return {
    name: theme.name,
    bg: c.bg,
    surface: c.surface,
    textPrimary: c.textPrimary,
    textMuted: c.textMuted,
    accent: c.accent,
    error: c.error,
    charPending: c.charPending,
    charCurrent: c.charCurrent,
    cursor: c.cursor,
  };
}

const PALETTES: Palette[] = [
  {
    name: 'globals.css @theme (défaut avant paint)',
    bg: root.bg!,
    surface: root.surface!,
    textPrimary: root['text-primary']!,
    textMuted: root['text-muted']!,
    accent: root.accent!,
    error: root.error!,
    // Le bloc @theme ne définit pas les tokens char-* : ils tombent sur leurs
    // équivalents via les fallbacks CSS (`--color-char-pending` → muted, etc.).
    charPending: root['text-muted']!,
    charCurrent: root['text-primary']!,
    cursor: root.accent!,
  },
  ...Object.values(APP_THEMES).map(fromThemeConfig),
  ...[terminalTheme, noirTheme, midnightSunTheme, arcadeTheme].map(
    fromThemeConfig,
  ),
];

interface Pair {
  label: string;
  fg: string;
  bg: string;
  min: number;
}

function criticalPairs(p: Palette): Pair[] {
  return [
    // 1.4.3 : texte courant sur les deux fonds
    { label: 'textPrimary sur bg', fg: p.textPrimary, bg: p.bg, min: AA_NORMAL },
    {
      label: 'textPrimary sur surface',
      fg: p.textPrimary,
      bg: p.surface,
      min: AA_NORMAL,
    },
    { label: 'textMuted sur bg', fg: p.textMuted, bg: p.bg, min: AA_NORMAL },
    {
      label: 'textMuted sur surface',
      fg: p.textMuted,
      bg: p.surface,
      min: AA_NORMAL,
    },
    {
      label: 'accent (lien/label) sur bg',
      fg: p.accent,
      bg: p.bg,
      min: AA_NORMAL,
    },
    {
      label: 'accent (lien/label) sur surface',
      fg: p.accent,
      bg: p.surface,
      min: AA_NORMAL,
    },
    { label: 'error sur bg', fg: p.error, bg: p.bg, min: AA_NORMAL },
    { label: 'error sur surface', fg: p.error, bg: p.surface, min: AA_NORMAL },
    // 1.4.3 : texte large (zone de frappe, 1.75rem)
    {
      label: 'charPending sur bg (large)',
      fg: p.charPending,
      bg: p.bg,
      min: AA_LARGE,
    },
    {
      label: 'charCurrent sur bg (large)',
      fg: p.charCurrent,
      bg: p.bg,
      min: AA_LARGE,
    },
    // 1.4.11 : le caret est le seul indicateur de position
    { label: 'cursor sur bg', fg: p.cursor, bg: p.bg, min: AA_LARGE },
    { label: 'cursor sur surface', fg: p.cursor, bg: p.surface, min: AA_LARGE },
  ];
}

describe.each(PALETTES)('contraste AA, thème « $name »', (palette) => {
  it.each(criticalPairs(palette))(
    '$label ≥ $min:1',
    ({ label, fg, bg, min }) => {
      const ratio = contrast(fg, bg);
      expect(
        ratio,
        `${palette.name}, ${label} : ${ratio.toFixed(2)}:1 (minimum ${min}:1) · fg ${fg} sur bg ${bg}`,
      ).toBeGreaterThanOrEqual(min);
    },
  );
});
