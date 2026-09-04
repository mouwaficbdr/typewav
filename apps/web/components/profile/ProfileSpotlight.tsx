'use client';

/**
 * ProfileSpotlight : la coquille de la page profil.
 *
 * N'est plus qu'un fond plein sur toute la hauteur. Les couches décoratives
 * (grille gravée, halo d'angle, halo qui suit le curseur) ont été retirées :
 * elles s'empilaient en haut de page et créaient une rupture visuelle au ras
 * de la nav sticky. La page doit rester une seule surface continue.
 */

export function ProfileSpotlight({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {children}
    </div>
  );
}
