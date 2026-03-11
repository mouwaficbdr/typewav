'use client';

/**
 * ResetPasswordClient — formulaire de réinitialisation de mot de passe.
 * Client Component justifié : appel Supabase browser client, gestion de formulaire.
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

export function ResetPasswordClient() {
  const t = useTranslations('auth');
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(t('resetError'));
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch {
      setError(t('resetError'));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-text-muted)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.875rem',
    padding: '10px 14px',
    width: '100%',
    transition: 'border-color var(--transition-fast)',
    // Pas d'outline:none — :focus-visible géré via la classe CSS .form-input
  };

  if (sent) {
    return (
      <div
        style={{
          color: 'var(--color-accent)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.875rem',
          textAlign: 'center',
          maxWidth: '360px',
        }}
      >
        <p style={{ marginBottom: '1rem' }}>{t('resetSent')}</p>
        <Link
          href={`/${locale}/auth/login`}
          style={{
            color: 'var(--color-text-muted)',
            textDecoration: 'underline',
          }}
        >
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      style={{ width: '100%', maxWidth: '360px' }}
    >
      <div className="flex flex-col gap-4">
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
        >
          {t('resetDescription')}
        </p>

        <label htmlFor="reset-email" className="sr-only">
          {t('emailLabel')}
        </label>
        <input
          id="reset-email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="form-input"
          style={inputStyle}
        />

        {error && (
          <p
            style={{
              color: 'var(--color-error)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
            }}
            role="alert"
          >
            {error}
          </p>
        )}

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
          {loading ? '…' : t('resetButton')}
        </button>

        <Link
          href={`/${locale}/auth/login`}
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            textDecoration: 'none',
            textAlign: 'center',
          }}
          className="hover:underline"
        >
          {t('backToLogin')}
        </Link>
      </div>
    </form>
  );
}
