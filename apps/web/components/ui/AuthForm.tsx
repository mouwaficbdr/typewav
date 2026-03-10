'use client';

/**
 * AuthForm — formulaire de connexion / inscription réutilisable.
 *
 * Client Component justifié : gestion de formulaire, appels Supabase.
 * Spec : docs/ARCHITECTURE.md — @supabase/ssr createBrowserClient
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
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
      setError('Service d\'authentification non configuré. Ajoutez vos variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local.');
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
        setSuccess(
          'Compte créé ! Vérifiez votre email pour confirmer votre inscription.',
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push('/');
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.875rem',
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      style={{ width: '100%', maxWidth: '360px' }}
    >
      <div className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          minLength={8}
          style={inputStyle}
        />

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
            borderRadius: '4px',
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
            ? 'Chargement…'
            : mode === 'signup'
              ? 'Créer un compte'
              : 'Se connecter'}
        </button>
      </div>
    </form>
  );
}
