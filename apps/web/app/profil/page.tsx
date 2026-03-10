import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProfilClient } from './ProfilClient';

export const metadata: Metadata = {
  title: 'Profil — TypeWav',
  description: 'Ta progression, tes records et tes statistiques.',
};

function ProfilLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: 14,
      }}
    >
      Chargement du profil…
    </div>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={<ProfilLoadingFallback />}>
      <ProfilClient />
    </Suspense>
  );
}
