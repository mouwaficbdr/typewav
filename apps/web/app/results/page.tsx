import { Suspense } from 'react';
import { ResultsPageClient } from './ResultsPageClient';

/**
 * Route /results — Server Component wrapper.
 * Les params URL contiennent les stats essentielles (wpm, accuracy, etc.)
 * Le détail complet est en IndexedDB (chargé côté client).
 */
export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsLoadingFallback />}>
      <ResultsPageClient />
    </Suspense>
  );
}

function ResultsLoadingFallback() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-muted)',
      }}
    >
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem' }}>
        Chargement des résultats…
      </p>
    </main>
  );
}
