import { NavLogo } from '@/components/ui/NavLogo';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordClient } from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe',
};

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { locale } = await params;

  return (
    <main
      className="flex flex-col items-center justify-center p-8"
      style={{
        minHeight: 'calc(100dvh - 48px)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <NavLogo locale={locale} />
      </div>
      <Suspense>
        <ResetPasswordClient />
      </Suspense>
    </main>
  );
}
