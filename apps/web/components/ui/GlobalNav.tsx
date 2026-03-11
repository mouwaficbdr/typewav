'use client';

/**
 * GlobalNav — barre de navigation persistante.
 *
 * Client Component justifié : useUser() (état auth), usePathname(), useLocale().
 * Affiché dans [locale]/layout.tsx — visible sur toutes les routes.
 */

import { useUser } from '@/hooks/useUser';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function GlobalNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { user, loading, pseudo } = useUser();

  const navLinks = [
    { href: `/${locale}/profil`, label: t('profile') },
    { href: `/${locale}/classement`, label: t('leaderboard') },
    { href: `/${locale}/premium`, label: t('premium') },
  ];

  return (
    <nav
      aria-label={t('mainNav')}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '48px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.875rem',
      }}
    >
      {/* Logo */}
      <Link
        href={`/${locale}`}
        style={{
          color: 'var(--color-text-primary)',
          textDecoration: 'none',
          fontFamily: 'var(--font-display)',
          fontWeight: '300',
          fontSize: '1.125rem',
          letterSpacing: '0.08em',
        }}
      >
        TypeWav
      </Link>

      {/* Liens de navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                color: isActive
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              className="hover:text-[var(--color-text-primary)]"
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Auth state */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {loading ? null : user ? (
          <span
            style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}
          >
            {pseudo || user.email?.split('@')[0] || t('account')}
          </span>
        ) : (
          <Link
            href={`/${locale}/auth/login`}
            style={{
              color: 'var(--color-accent)',
              textDecoration: 'none',
              fontSize: '0.8125rem',
            }}
          >
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
}
