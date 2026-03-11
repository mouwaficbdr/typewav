'use client';

/**
 * GlobalNav — barre de navigation persistante et flottante.
 *
 * v2 — FORGE [1.2] : icônes uniquement, style flottant backdrop-blur, logo SVG.
 * Client Component justifié : usePathname() (état actif), useUser() (auth).
 * Spec : docs/specs/15-global-navigation.md (v2)
 */

import { useUser } from '@/hooks/useUser';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLogo } from './NavLogo';

const NAV_ITEMS = [
  { key: 'home', icon: '⌨', path: '' },
  { key: 'leaderboard', icon: '◎', path: 'classement' },
  { key: 'premium', icon: '★', path: 'premium' },
] as const;

export function GlobalNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useUser();

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
        backdropFilter: 'blur(8px)',
        background: 'color-mix(in srgb, var(--color-bg) 70%, transparent)',
      }}
    >
      {/* Logo */}
      <NavLogo locale={locale} />

      {/* Liens principaux — icônes uniquement */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {NAV_ITEMS.map(({ key, icon, path }) => {
          const href = path ? `/${locale}/${path}` : `/${locale}`;
          const isActive = path
            ? pathname.startsWith(`/${locale}/${path}`)
            : pathname === `/${locale}` || pathname === `/${locale}/`;

          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={t(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                color: isActive
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
                fontSize: '1rem',
                textDecoration: 'none',
                transition: 'color var(--transition-fast)',
              }}
              className="hover:text-[var(--color-text-primary)]"
            >
              {icon}
            </Link>
          );
        })}
      </div>

      {/* Auth state — icône ○ profil ou lien connexion */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <Link
            href={`/${locale}/profil`}
            aria-label={t('profile')}
            aria-current={
              pathname.startsWith(`/${locale}/profil`) ? 'page' : undefined
            }
            style={{
              color: pathname.startsWith(`/${locale}/profil`)
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
              fontSize: '1rem',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)',
            }}
          >
            ○
          </Link>
        ) : (
          <Link
            href={`/${locale}/auth/login`}
            aria-label={t('login')}
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-ui)',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)',
            }}
            className="hover:text-[var(--color-accent)]"
          >
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
}
