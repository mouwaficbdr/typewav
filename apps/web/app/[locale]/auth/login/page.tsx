import { AuthForm } from '@/components/ui/AuthForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main
      className="flex flex-col items-center justify-center p-8"
      style={{
        minHeight: 'calc(100dvh - 48px)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
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
          href="/auth/signup"
          style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
        >
          Créer un compte
        </Link>
      </p>
    </main>
  );
}
