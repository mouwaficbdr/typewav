import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordClient } from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe — TypeWav',
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}
