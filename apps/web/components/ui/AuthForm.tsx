'use client';

/**
 * AuthForm — formulaire de connexion / inscription réutilisable.
 *
 * Client Component justifié : gestion de formulaire, appels Supabase.
 * Spec : docs/ARCHITECTURE.md — @supabase/ssr createBrowserClient
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth');
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : 0.3;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = getSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!supabase) {
      setError(t('notConfigured'));
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        setSuccess(t('signupSuccess'));
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push(`/${locale}`);
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('genericError');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-text-muted)', // contraste 5.7:1 — WCAG 1.4.11 AA ✅
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.875rem',
    padding: '10px 14px',
    width: '100%',
    transition: 'border-color var(--transition-fast)',
    // Pas d'outline:none — :focus-visible géré via la classe CSS .form-input
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      style={{ width: '100%', maxWidth: '360px' }}
    >
      <div className="flex flex-col gap-4">
        <label htmlFor="auth-email" className="sr-only">
          {t('emailLabel')}
        </label>
        <input
          id="auth-email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="form-input"
          style={inputStyle}
        />
        <label htmlFor="auth-password" className="sr-only">
          {t('passwordLabel')}
        </label>
        <input
          id="auth-password"
          type="password"
          placeholder={t('passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          minLength={8}
          className="form-input"
          style={inputStyle}
        />

        {mode === 'login' && (
          <Link
            href={`/${locale}/auth/reset-password`}
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              textDecoration: 'none',
              alignSelf: 'flex-end',
            }}
            className="hover:underline"
          >
            {t('forgotPassword')}
          </Link>
        )}

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration }}
              style={{
                color: 'var(--color-error)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
              }}
            >
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration }}
              style={{
                color: 'var(--color-accent)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
              }}
            >
              {success}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: 'var(--color-accent)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-bg)',
            cursor: loading ? 'wait' : 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            fontWeight: '600',
            letterSpacing: '0.05em',
            opacity: loading ? 0.7 : 1,
            padding: '10px 14px',
            textTransform: 'uppercase',
            transition: 'opacity 0.2s',
            width: '100%',
          }}
        >
          {loading
            ? t('loading')
            : mode === 'signup'
              ? t('createAccount')
              : t('signIn')}
        </button>
      </div>
    </form>
  );
}
