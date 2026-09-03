import { render } from '@testing-library/react';
import type { SessionResult } from '@typewav/types';
import { describe, expect, it, vi } from 'vitest';
import {
  ContributionHeatmap,
  buildHeatmapData,
} from '../ContributionHeatmap';

// next-intl : `t` renvoie la clé, `format.dateTime` délègue à un Intl réel en
// anglais pour prouver que la mise en forme suit bien la locale injectée.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({
    dateTime: (date: Date, opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-US', opts).format(date),
  }),
}));

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

function makeSession(timestamp: number): SessionResult {
  return {
    id: `s-${timestamp}`,
    timestamp,
    wpm: 60,
    wpmNet: 60,
    accuracy: 95,
    consistency: 85,
    duration: 60_000,
    mode: 'classic',
    themeId: 'terminal',
    soundPackId: 'piano',
    keystrokeData: [],
  };
}

describe('buildHeatmapData', () => {
  it('met en forme la date de chaque cellule via le formateur injecté', () => {
    const cells = buildHeatmapData([], (ts) =>
      new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(new Date(ts)),
      NOW,
    );
    const today = cells.at(-1)!;
    expect(today.daysAgo).toBe(0);
    expect(today.date).toBe(
      new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(new Date(NOW)),
    );
  });

  it('un formateur de locale différente change les libellés de date', () => {
    const fr = buildHeatmapData([], (ts) =>
      new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(ts)),
      NOW,
    );
    const en = buildHeatmapData([], (ts) =>
      new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(ts)),
      NOW,
    );
    expect(fr.at(-1)!.date).not.toBe(en.at(-1)!.date);
  });

  it('compte les sessions par jour sur la fenêtre de 90 jours', () => {
    const cells = buildHeatmapData(
      [makeSession(NOW - 2 * DAY), makeSession(NOW - 2 * DAY)],
      () => 'x',
      NOW,
    );
    expect(cells.find((c) => c.daysAgo === 2)!.count).toBe(2);
    expect(cells.find((c) => c.daysAgo === 5)!.count).toBe(0);
  });
});

describe('<ContributionHeatmap />', () => {
  it('libellés de légende et aria issus des traductions', () => {
    const { container, getByLabelText } = render(
      <ContributionHeatmap sessions={[]} />,
    );
    getByLabelText('heatmapAria');
    expect(container.textContent).toContain('heatmapLess');
    expect(container.textContent).toContain('heatmapMore');
  });

  it('les cellules se colorent via des tokens de thème, pas des hex figés', () => {
    const { container } = render(
      <ContributionHeatmap sessions={[makeSession(Date.now())]} />,
    );
    const fills = [...container.querySelectorAll('rect')].map((r) =>
      r.getAttribute('fill'),
    );
    expect(fills.length).toBeGreaterThan(0);
    for (const fill of fills) {
      expect(fill).toMatch(/var\(--color-|color-mix\(/);
    }
  });

  it('le tooltip de cellule combine la date localisée et le compte traduit', () => {
    const { container } = render(
      <ContributionHeatmap sessions={[makeSession(Date.now())]} />,
    );
    const titles = [...container.querySelectorAll('title')].map(
      (n) => n.textContent,
    );
    // date en-US (mock) + clé ICU du compte, séparés par " · "
    expect(titles.some((t) => t?.includes(' · heatmapSessions'))).toBe(true);
    expect(titles.some((t) => t?.includes('—'))).toBe(false);
  });
});
