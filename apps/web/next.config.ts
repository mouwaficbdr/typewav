import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { getSecurityHeaders } from './lib/security-headers';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Turbopack est activé via --turbopack dans le script dev
  // Pas de configuration expérimentale nécessaire en Next.js 16

  // Packages à transpiler (workspace packages)
  transpilePackages: ['@typewav/audio-engine', '@typewav/types'],

  // Headers de sécurité (HSTS, CSP, anti-clickjacking, Permissions-Policy...).
  // Détail et justification des origines : lib/security-headers.ts.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: getSecurityHeaders({
          dev: process.env.NODE_ENV === 'development',
        }),
      },
    ];
  },
};

export default withNextIntl(nextConfig);
