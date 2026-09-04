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
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in srgb, var(--color-text-primary) 4%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--color-text-primary) 4%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)',
        }}
      />
      
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: useMotionTemplate`radial-gradient(800px circle at ${smoothX}px ${smoothY}px, color-mix(in srgb, var(--color-accent) 4%, transparent), transparent 80%)`,
        }}
      />
      
      <div 
        className="absolute top-0 right-0 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 5%, transparent) 0%, transparent 70%)',
          filter: 'blur(80px)',
          transform: 'translate(20%, -20%)'
        }}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
