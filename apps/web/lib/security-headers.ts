/**
 * En-têtes de sécurité HTTP appliqués à toutes les routes.
 *
 * Extrait de `next.config.ts` pour être testable en isolation. Aucune
 * dépendance : ce module est aussi importé par la config Next (avant le
 * bundler), il doit rester du TypeScript pur.
 *
 * Note CSP : `script-src` garde `'unsafe-inline'` (script inline du
 * ThemeScript + bootstrap de Next App Router, sans infra de nonce). Passer
 * à une CSP à nonce demanderait un middleware qui injecte le nonce par
 * requête et le propage à chaque script inline ; hors périmètre ici.
 */

export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Origines externes réellement contactées par le client :
 * - tonejs.github.io : samples de piano Salamander chargés par Tone.Sampler
 * - *.supabase.co : REST + Realtime, features auth optionnelles
 *
 * Pas d'origine Stripe : le checkout se fait par redirection serveur
 * (`fetch('/api/stripe/checkout')` puis `window.location`), sans Stripe.js
 * embarqué, donc ni `js.stripe.com` (script/frame) ni `api.stripe.com`
 * (connect) ne sont nécessaires.
 */
const CONNECT_SRC = [
  "'self'",
  'https://tonejs.github.io',
  'https://*.supabase.co',
  'wss://*.supabase.co',
];

function buildContentSecurityPolicy(dev: boolean): string {
  const scriptSrc = ["'self'", "'unsafe-inline'"];
  if (dev) scriptSrc.push("'unsafe-eval'"); // React Refresh / Turbopack HMR

  const connectSrc = [...CONNECT_SRC];
  if (dev) connectSrc.push('ws://localhost:*', 'http://localhost:*');

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(' ')}`,
    "media-src 'self' blob: data: https://tonejs.github.io",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  if (!dev) directives.push('upgrade-insecure-requests');

  return directives.join('; ');
}

/**
 * @param opts.dev `true` sous `next dev` (assouplit la CSP pour le HMR).
 */
export function getSecurityHeaders(opts: { dev: boolean }): SecurityHeader[] {
  return [
    {
      key: 'Content-Security-Policy',
      value: buildContentSecurityPolicy(opts.dev),
    },
    {
      // Pas de `preload` : l'inscription à la liste de préchargement des
      // navigateurs est un engagement lourd et lent à défaire. À ajouter
      // seulement si le domaine est soumis délibérément.
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains',
    },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    },
  ];
}
