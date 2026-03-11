'use client';

/**
 * ResultsPageClient — lit les params URL et affiche les résultats.
 * Client Component justifié : useSearchParams + IndexedDB (records).
 * Spec : docs/specs/30-results-refonte.md
 */

import { ResultsPage } from '@/components/typing/ResultsPage';
import { getPersonalRecords } from '@/lib/db';
import { useSessionStore } from '@/stores/useSessionStore';
import type { PersonalRecords, TypingMode } from '@typewav/types';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ResultsPageClient() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<PersonalRecords | null>(null);

  const noteEvents = useSessionStore((s) => s.noteEvents);
  const startedAt = useSessionStore((s) => s.startedAt);
  const endedAt = useSessionStore((s) => s.endedAt);
  const sessionDuration =
    startedAt !== null && endedAt !== null ? endedAt - startedAt : undefined;

  const wpm = Number(searchParams.get('wpm') ?? '0');
  const wpmNet = Number(searchParams.get('wpmNet') ?? '0');
  const accuracy = Number(searchParams.get('accuracy') ?? '0');
  const consistency = Number(searchParams.get('consistency') ?? '0');
  const durationMs = Number(searchParams.get('duration') ?? '60000');
  const mode = (searchParams.get('mode') ?? 'classic') as TypingMode;
  const collectionId = searchParams.get('collection') ?? undefined;
  const sessionId = searchParams.get('id') ?? undefined;

  const computedDurationMs = sessionDuration ?? durationMs;

  useEffect(() => {
    getPersonalRecords()
      .then(setRecords)
      .catch(() => null);
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
      durationMs={computedDurationMs}
      mode={mode}
      {...(collectionId !== undefined ? { collectionId } : {})}
      {...(sessionId !== undefined ? { sessionId } : {})}
      isNewWpmRecord={isNewWpmRecord}
      isNewAccuracyRecord={isNewAccuracyRecord}
      {...(noteEvents.length > 0 ? { noteEvents } : {})}
    />
  );
}
