import { Suspense } from 'react';
import { PremiumPageClient } from './PremiumPageClient';

export const metadata = {
  title: 'Premium',
  description:
    'Débloquez les packs sonores cinématiques et la synchronisation cloud.',
};

export default function PremiumPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            minHeight: '100dvh',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          Chargement…
        </div>
      }
    >
      <PremiumPageClient />
    </Suspense>
  );
}
