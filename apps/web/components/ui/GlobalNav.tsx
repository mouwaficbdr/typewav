'use client';

/**
 * GlobalNav : barre de navigation persistante et flottante.
 * Icônes Lucide, padding fluide (voir --nav-height dans globals.css).
 * v1 sans comptes : pas d'état login, /profil est une entrée permanente.
 */

import { Info, Keyboard, Settings, Trophy, UserCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavLogo } from './NavLogo';

export function GlobalNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const NAV_ITEMS = [
    { key: 'typing', label: t('typing'), Icon: Keyboard, path: '' },
    {
      key: 'leaderboard',
      label: t('leaderboard'),
      Icon: Trophy,
      path: 'classement',
    },
    { key: 'profile', label: t('profile'), Icon: UserCircle, path: 'profil' },
    {
      key: 'settings',
      label: t('settings'),
      Icon: Settings,
      path: 'parametres',
    },
    { key: 'about', label: t('about'), Icon: Info, path: 'about' },
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
        flexWrap: 'wrap',
        rowGap: 8,
        // Padding fluide : se resserre sur mobile (cf. --nav-height dans globals.css).
        padding:
          'clamp(16px, 4vw, 36px) clamp(16px, 4vw, 40px) clamp(12px, 2.5vw, 24px)',
        margin: '0 auto',
        maxWidth: '1600px',
        width: '100%',
        // Aucun fond : la nav doit être la même surface que la page, sans
        // rupture visible au ras du header. Le halo d'accent supérieur du
        // <body> qui justifiait un fond plein a été retiré de globals.css ;
        // il ne reste que la vignette basse, quasi nulle en haut de page.
        background: 'transparent',
      }}
    >
      {/* Logo at extreme left */}
      <NavLogo locale={locale} />

      {/* Nav Items groupés à droite */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vw, 28px)',
        }}
      >
        {NAV_ITEMS.map(({ key, label, Icon, path }) => {
          const href = path === '' ? `/${locale}` : `/${locale}/${path}`;
          const isActive =
            path === ''
              ? pathname === `/${locale}` || pathname === `/${locale}/`
              : pathname.startsWith(`/${locale}/${path}`);

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
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
