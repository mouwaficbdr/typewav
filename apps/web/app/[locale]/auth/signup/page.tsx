import { AuthForm } from '@/components/ui/AuthForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <main
      className="flex flex-col items-center justify-center p-8"
      style={{
        minHeight: 'calc(100dvh - 48px)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <AuthForm mode="signup" />

      <p
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          marginTop: '1.5rem',
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
