import { AuthForm } from '@/components/ui/AuthForm';
import { NavLogo } from '@/components/ui/NavLogo';
import Link from 'next/link';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
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

      <AuthForm mode="login" />

      <p
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          marginTop: '1.5rem',
        }}
      >
        Pas encore de compte ?{' '}
        <Link
          href={`/${locale}/auth/signup`}
          style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
        >
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
