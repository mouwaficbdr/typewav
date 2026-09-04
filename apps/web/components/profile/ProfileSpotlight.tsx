'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react';

export function ProfileSpotlight({ children }: { children: React.ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden"
      onMouseMove={handleMouseMove}
      style={{ background: 'var(--color-bg)' }}
    >
      {/* Seul reste le halo qui suit le curseur : discret, interactif, jamais
          une bande fixe. La grille gravée et le halo d'angle statique ont été
          retirés (ils s'empilaient en haut de page et bavaient sur la nav). */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: useMotionTemplate`radial-gradient(800px circle at ${smoothX}px ${smoothY}px, color-mix(in srgb, var(--color-accent) 4%, transparent), transparent 80%)`,
        }}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
