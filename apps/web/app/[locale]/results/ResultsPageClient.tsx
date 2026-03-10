'use client';

/**
 * ResultsPageClient — lit les params URL et affiche les résultats.
 * Client Component justifié : useSearchParams ne fonctionne qu'en mode client.
 */

import { ResultsPage } from '@/components/typing/ResultsPage';
import { useSearchParams } from 'next/navigation';

export function ResultsPageClient() {
  const searchParams = useSearchParams();

  const wpm = Number(searchParams.get('wpm') ?? '0');
  const wpmNet = Number(searchParams.get('wpmNet') ?? '0');
  const accuracy = Number(searchParams.get('accuracy') ?? '0');
  const consistency = Number(searchParams.get('consistency') ?? '0');
  const recommendation = searchParams.get('recommendation') ?? '';
  const sessionId = searchParams.get('id') ?? undefined;

  return (
    <ResultsPage
      wpm={wpm}
      wpmNet={wpmNet}
      accuracy={accuracy}
      consistency={consistency}
      recommendation={recommendation}
      {...(sessionId !== undefined ? { sessionId } : {})}
    />
  );
}
