import { AuthForm } from '@/components/ui/AuthForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <header className="text-center">
        <Link href="/">
          <h1
            className="text-3xl font-light tracking-widest"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-accent)',
            }}
          >
            TypeWav
          </h1>
        </Link>
        <p
          className="mt-2 text-sm tracking-widest uppercase"
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Créer un compte
        </p>
      </header>

      <AuthForm mode="signup" />

      <p
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
        }}
      >
        Déjà un compte ?{' '}
        <Link
          href="/auth/login"
          style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
        >
          Se connecter
        </Link>
      </p>
    </main>
  );
}
