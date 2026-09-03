/**
 * Feature flags.
 */

/**
 * true uniquement pour `next dev` : Next.js remplace process.env.NODE_ENV à
 * la compilation, donc cette constante est figée à `false` dans tout build
 * de production (`next build`/`next start`) et ne peut pas fuir en prod.
 */
export const IS_DEV_MODE = process.env.NODE_ENV === 'development';
