'use client';

/**
 * WpmProgressChart — évolution WPM dans le temps.
 * Recharts 3.8.0 — LineChart avec courbe de tendance.
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Dashboard profil
 * Client Component justifié : Recharts est interactif, accès aux données client.
 */

import type { SessionResult } from '@typewav/types';
import { useFormatter, useTranslations } from 'next-intl';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface WpmProgressChartProps {
  sessions: SessionResult[];
  /** Nombre de jours à afficher: 7, 30 ou 90 */
  days?: 7 | 30 | 90;
}

interface ChartDataPoint {
  date: string;
  wpm: number;
  trend: number | null;
}

/**
 * Regroupe les sessions par jour et calcule la médiane WPM + une tendance
 * linéaire. La mise en forme de l'étiquette de date est déléguée à `formatDate`
 * (locale-aware côté composant via `useFormatter`).
 */
export function groupByDay(
  sessions: SessionResult[],
  days: number,
  formatDate: (timestamp: number) => string,
  now: number = Date.now(),
): ChartDataPoint[] {
  const cutoff = now - days * 86_400_000;
  const recent = sessions.filter((s) => s.timestamp >= cutoff);

  // Grouper par étiquette de jour localisée
  const byDay = new Map<string, number[]>();
  for (const s of recent) {
    const date = formatDate(s.timestamp);
    if (!byDay.has(date)) byDay.set(date, []);
    byDay.get(date)!.push(s.wpm);
  }

  const points: { date: string; wpm: number }[] = [];
  for (const [date, wpms] of byDay.entries()) {
    const sorted = [...wpms].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? (sorted[mid - 1]! + sorted[mid]!) / 2
        : sorted[mid]!;
    points.push({ date, wpm: Math.round(median) });
  }

  // Régression linéaire simple pour la tendance
  const n = points.length;
  if (n < 2) {
    return points.map((p) => ({ ...p, trend: null }));
  }

  const sumX = (n * (n - 1)) / 2;
  const sumX2 = ((n - 1) * n * (2 * n - 1)) / 6;
  const sumY = points.reduce((acc, p) => acc + p.wpm, 0);
  const sumXY = points.reduce((acc, p, i) => acc + i * p.wpm, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return points.map((p, i) => ({
    ...p,
    trend: Math.round(intercept + slope * i),
  }));
}

export function WpmProgressChart({
  sessions,
  days = 30,
}: WpmProgressChartProps) {
  const t = useTranslations('profile');
  const format = useFormatter();

  const data = groupByDay(sessions, days, (ts) =>
    format.dateTime(new Date(ts), { month: 'short', day: 'numeric' }),
  );

  if (data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: 14,
        }}
      >
        {t('chartEmpty')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#888', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#888', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          unit=" WPM"
          width={65}
        />
        <Tooltip
          contentStyle={{
            background: '#0A0A0A',
            border: '1px solid #1A1A2E',
            borderRadius: 8,
            fontFamily: 'var(--font-ui)',
          }}
          labelStyle={{ color: '#888', fontSize: 11 }}
          itemStyle={{ color: '#00D4AA' }}
          formatter={(value) => [`${value} WPM`, t('chartMedian')]}
        />
        <Legend
          wrapperStyle={{
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            color: '#888',
          }}
        />
        <Line
          type="monotone"
          dataKey="wpm"
          stroke="#00D4AA"
          strokeWidth={2}
          dot={{ r: 3, fill: '#00D4AA' }}
          name="WPM"
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="trend"
          stroke="#FFD70066"
          strokeWidth={1.5}
          strokeDasharray="5 3"
          dot={false}
          name={t('chartTrend')}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
