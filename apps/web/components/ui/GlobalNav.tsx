'use client';

/**
 * GlobalNav — barre de navigation persistante et flottante.
 * Refonte Premium : Design plus grand, icons Lucide-React, textes visibles,
 * effets de survol marqués et intégration parfaite à la DA.
 */

import { useUser } from '@/hooks/useUser';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Star, UserCircle, LogIn, Crown } from 'lucide-react';
import { NavLogo } from './NavLogo';

export function GlobalNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useUser();

  const NAV_ITEMS = [
    { key: 'leaderboard', label: t('leaderboard'), Icon: Trophy, path: 'classement' },
    { key: 'premium', label: t('premium'), Icon: Crown, path: 'premium' },
  ] as const;

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
        padding: '36px 40px 24px', // Bigger padding for premium feel
        margin: '0 auto',
        maxWidth: '1600px', // A bit wider to accommodate text
        width: '100%',
        background: 'transparent',
      }}
    >
      {/* Logo at extreme left */}
      <NavLogo locale={locale} />

      {/* Nav Items groupés à droite */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        {/* Menu principal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {NAV_ITEMS.map(({ key, label, Icon, path }) => {
            const href = `/${locale}/${path}`;
            const isActive = pathname.startsWith(`/${locale}/${path}`);

            return (
              <Link
                key={key}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '1.05rem',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 500,
                  color: isActive
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className={`group hover:text-[var(--color-text-primary)] hover:-translate-y-0.5`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-all duration-300 ${
                    isActive 
                      ? 'text-[var(--color-accent)] drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_60%,transparent)]' 
                      : 'group-hover:text-[var(--color-accent)]'
                  }`}
                />
                <span className="tracking-wide">{label}</span>
                
                {/* Active Indicator Underline */}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '0',
                      width: '100%',
                      height: '2px',
                      backgroundColor: 'var(--color-accent)',
                      borderRadius: '2px',
                      boxShadow: '0 0 8px 1px color-mix(in srgb, var(--color-accent) 60%, transparent)',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Separator */}
        <div style={{ width: '2px', height: '24px', backgroundColor: 'var(--color-surface)', borderRadius: '2px' }} />

        {/* Auth / Avatar */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
            <Link
              href={`/${locale}/profil`}
              aria-label={t('profile')}
              aria-current={pathname.startsWith(`/${locale}/profil`) ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: '1.05rem',
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                color: pathname.startsWith(`/${locale}/profil`)
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
                textDecoration: 'none',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="group hover:text-[var(--color-text-primary)] hover:-translate-y-0.5"
            >
              <UserCircle
                size={22}
                strokeWidth={pathname.startsWith(`/${locale}/profil`) ? 2.5 : 2}
                className={`transition-all duration-300 ${
                  pathname.startsWith(`/${locale}/profil`) 
                    ? 'text-[var(--color-accent)] drop-shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent)_60%,transparent)]' 
                    : 'group-hover:text-[var(--color-accent)]'
                }`}
              />
              <span className="tracking-wide">{t('profile')}</span>
              {pathname.startsWith(`/${locale}/profil`) && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '0',
                    width: '100%',
                    height: '2px',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: '2px',
                    boxShadow: '0 0 8px 1px color-mix(in srgb, var(--color-accent) 60%, transparent)',
                  }}
                />
              )}
            </Link>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              aria-label={t('login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '1.05rem',
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="group hover:text-[var(--color-text-primary)] hover:-translate-y-0.5"
            >
              <LogIn 
                size={20} 
                strokeWidth={2}
                className="transition-colors duration-300 group-hover:text-[var(--color-accent)]" 
              />
              <span className="tracking-wide">{t('login')}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
