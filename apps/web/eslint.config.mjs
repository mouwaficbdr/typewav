import nextConfig from 'eslint-config-next';

const config = [
  // Ignorer les dossiers générés et les dépendances
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'build/**'],
  },
  ...nextConfig,
];

export default config;
