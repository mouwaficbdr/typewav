import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClassementClient } from './ClassementClient';

export const metadata: Metadata = {
  title: 'Classement',
  description: 'Leaderboard hebdomadaire TypeWav.',
};

export default function ClassementPage() {
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
            Chargement…
          </p>
        </main>
      }
    >
      <ClassementClient />
    </Suspense>
  );
}
