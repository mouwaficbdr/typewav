'use client';

/**
 * ResultsPageClient — lit les params URL et affiche les résultats.
 * Client Component justifié : useSearchParams + IndexedDB (records).
 * Spec : docs/specs/25-results-page-enhancement.md
 */

import { ResultsPage } from '@/components/typing/ResultsPage';
import { getPersonalRecords } from '@/lib/db';
import type { PersonalRecords } from '@typewav/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ResultsPageClient() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<PersonalRecords | null>(null);

  const wpm = Number(searchParams.get('wpm') ?? '0');
  const wpmNet = Number(searchParams.get('wpmNet') ?? '0');
  const accuracy = Number(searchParams.get('accuracy') ?? '0');
  const consistency = Number(searchParams.get('consistency') ?? '0');
  const recommendation = searchParams.get('recommendation') ?? '';
  const sessionId = searchParams.get('id') ?? undefined;

  useEffect(() => {
    getPersonalRecords().then(setRecords).catch(() => null);
  }, []);

  const isNewWpmRecord = records !== null && wpm > records.maxWpm.value;
  const isNewAccuracyRecord =
    records !== null && accuracy > records.maxAccuracy.value;

  return (
    <ResultsPage
      wpm={wpm}
      wpmNet={wpmNet}
      accuracy={accuracy}
      consistency={consistency}
      recommendation={recommendation}
      {...(sessionId !== undefined ? { sessionId } : {})}
      isNewWpmRecord={isNewWpmRecord}
      isNewAccuracyRecord={isNewAccuracyRecord}
    />
  );
}
