import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ChallengeClient } from './ChallengeClient';

export const metadata: Metadata = {
  title: 'Challenge',
  description: 'Relevez un défi de typing partagé.',
};

export default function ChallengePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center">
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Chargement du challenge…
          </p>
        </main>
      }
    >
      <ChallengeClient />
    </Suspense>
  );
}
