import { render } from '@testing-library/react';
import type { SessionResult } from '@typewav/types';
import { describe, expect, it, vi } from 'vitest';
import { WpmProgressChart, groupByDay } from '../WpmProgressChart';

// next-intl : `t` renvoie la clé ; `format.dateTime` délègue à un Intl réel.
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({
    dateTime: (date: Date, opts: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-US', opts).format(date),
  }),
}));

// recharts : composants capturés pour inspecter leurs props sans rendu réel.
vi.mock('recharts', () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    ResponsiveContainer: Pass,
    LineChart: Pass,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Legend: () => null,
    Line: (props: { dataKey: string; name: string; stroke: string }) => (
      <div
        data-testid={`line-${props.dataKey}`}
        data-name={props.name}
        data-stroke={props.stroke}
      />
    ),
    Tooltip: (props: {
      formatter: (v: number, n: string) => [string, string];
    }) => <div data-testid="tooltip" data-label={props.formatter(42, 'wpm')[1]} />,
  };
});

const DAY = 86_400_000;
const NOW = 1_700_000_000_000;

function makeSession(wpm: number, timestamp: number): SessionResult {
  return {
    id: `s-${timestamp}-${wpm}`,
    timestamp,
    wpm,
    wpmRaw: wpm,
    accuracy: 95,
    consistency: 85,
    duration: 60_000,
    mode: 'classic',
    themeId: 'terminal',
    soundPackId: 'piano',
    keystrokeData: [],
  };
}

const frShort = (ts: number) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'short', day: 'numeric' }).format(
    new Date(ts),
  );

describe('groupByDay', () => {
  it('étiquette chaque point via le formateur de date injecté', () => {
    const points = groupByDay(
      [makeSession(60, NOW - 1 * DAY)],
      30,
      frShort,
      NOW,
    );
    expect(points).toHaveLength(1);
    expect(points[0]!.date).toBe(frShort(NOW - 1 * DAY));
  });

  it('un formateur de locale différente change les étiquettes', () => {
    const session = [makeSession(60, NOW - 1 * DAY)];
    const fr = groupByDay(session, 30, (ts) =>
      new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(ts)),
      NOW,
    );
    const en = groupByDay(session, 30, (ts) =>
      new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(ts)),
      NOW,
    );
    expect(fr[0]!.date).not.toBe(en[0]!.date);
  });

  it('agrège la médiane WPM par jour', () => {
    const points = groupByDay(
      [
        makeSession(50, NOW - 1 * DAY),
        makeSession(60, NOW - 1 * DAY),
        makeSession(70, NOW - 1 * DAY),
      ],
      30,
      () => 'same-day',
      NOW,
    );
    expect(points).toHaveLength(1);
    expect(points[0]!.wpm).toBe(60);
  });
});

describe('<WpmProgressChart />', () => {
  it('état vide : message issu des traductions', () => {
    const { container } = render(<WpmProgressChart sessions={[]} />);
    expect(container.textContent).toContain('chartEmpty');
  });

  it('la ligne de tendance et le tooltip tirent leurs libellés des traductions', () => {
    const now = Date.now();
    const { getByTestId } = render(
      <WpmProgressChart
        sessions={[
          makeSession(60, now - 1 * DAY),
          makeSession(65, now - 2 * DAY),
        ]}
      />,
    );
    expect(getByTestId('line-trend').getAttribute('data-name')).toBe(
      'chartTrend',
    );
    expect(getByTestId('tooltip').getAttribute('data-label')).toBe(
      'chartMedian',
    );
  });

  it('la série WPM se trace avec le token accent, pas un hex figé', () => {
    const now = Date.now();
    const { getByTestId } = render(
      <WpmProgressChart sessions={[makeSession(60, now - 1 * DAY)]} />,
    );
    expect(getByTestId('line-wpm').getAttribute('data-stroke')).toBe(
      'var(--color-accent)',
    );
  });
});
