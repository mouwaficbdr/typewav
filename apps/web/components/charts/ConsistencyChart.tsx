'use client';

/**
 * ConsistencyChart : graphe WPM au fil du temps via Recharts.
 * Affiche la régularité de frappe : zones de chute en rouge.
 *
 * Client Component justifié : Recharts est une lib client-only.
 * Spec : docs/specs/02-diagnostic.md
 */

import type { KeystrokeEntry } from '@typewav/types';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ConsistencyChartProps {
  keystrokes: KeystrokeEntry[];
}

interface ChartPoint {
  second: number;
  wpm: number;
}

/**
 * Calcule le WPM par fenêtre de 5 secondes glissantes.
 * Retourne un tableau de points {second, wpm} pour le graphe.
 */
function buildChartData(keystrokes: KeystrokeEntry[]): ChartPoint[] {
  if (keystrokes.length < 2) return [];

  const firstTs = keystrokes[0]!.timestamp;
  const lastTs = keystrokes[keystrokes.length - 1]!.timestamp;
  const durationSec = Math.ceil((lastTs - firstTs) / 1000);

  if (durationSec < 2) return [];

  const points: ChartPoint[] = [];
  const windowMs = 5000;

  for (let sec = 1; sec <= durationSec; sec++) {
    const windowEnd = firstTs + sec * 1000;
    const windowStart = windowEnd - windowMs;

    const windowKeystrokes = keystrokes.filter(
      (k) => k.correct && k.timestamp >= windowStart && k.timestamp < windowEnd,
    );

    const wpm = Math.round((windowKeystrokes.length / 5) * (60000 / windowMs));
    points.push({ second: sec, wpm });
  }

  return points;
}

export function ConsistencyChart({ keystrokes }: ConsistencyChartProps) {
  const data = buildChartData(keystrokes);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md p-8"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-ui)',
          minHeight: '120px',
        }}
      >
        Données insuffisantes
      </div>
    );
  }

  const maxWpm = Math.max(...data.map((d) => d.wpm), 1);

  return (
    <div
      className="rounded-md p-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <p
        style={{
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}
      >
        WPM au fil du temps
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-accent)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="var(--color-accent)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="second"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            tickFormatter={(v: number) => `${v}s`}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, maxWpm + 10]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            width={32}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text-primary)',
              fontSize: '12px',
            }}
            formatter={(value) => [`${value as number} WPM`, '']}
            labelFormatter={(label) => `${label as number}s`}
          />
          <Area
            type="monotone"
            dataKey="wpm"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#wpmGradient)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-accent)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
