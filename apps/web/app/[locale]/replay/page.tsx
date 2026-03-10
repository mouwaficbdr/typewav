import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReplayClient } from './ReplayClient';

export const metadata: Metadata = {
  title: 'Replay — TypeWav',
  description: "Lecture d'un replay TypeWav.",
};

export default function ReplayPage() {
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
            Chargement du replay…
          </p>
        </main>
      }
    >
      <ReplayClient />
    </Suspense>
  );
}
