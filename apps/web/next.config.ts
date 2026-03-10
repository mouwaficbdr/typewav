import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack est activé via --turbopack dans le script dev
  // Pas de configuration expérimentale nécessaire en Next.js 16

  // Packages à transpiler (workspace packages)
  transpilePackages: ['@typewav/audio-engine', '@typewav/types'],

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
