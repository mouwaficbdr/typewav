'use client';

/**
 * MilestoneToast — notification de jalon débloqué.
 *
 * S'affiche en bas à droite de l'écran, s'auto-dismiss après 4s.
 * Spec : docs/specs/05-progression.md — Jalons débloquables
 * Client Component justifié : animation, timer, state UI.
 */

import { useProgressionStore } from '@/stores/useProgressionStore';
import type { Milestone } from '@typewav/types';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

const REWARD_ICONS: Record<Milestone['reward']['type'], string> = {
  soundpack: '🎵',
  theme: '🎨',
  collection: '📚',
  accent: '✨',
};

function SingleToast({
  milestone,
  onDismiss,
}: {
  milestone: Milestone;
  onDismiss: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? {} : { opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      role="alert"
      aria-live="polite"
      onClick={onDismiss}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 18px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-accent)',
        borderRadius: 10,
        cursor: 'pointer',
        maxWidth: 320,
        boxShadow: '0 4px 20px rgba(0,212,170,0.15)',
      }}
    >
      <span style={{ fontSize: 24 }}>
        {REWARD_ICONS[milestone.reward.type]}
      </span>
      <div>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--color-accent)',
          }}
        >
          Jalon débloqué !
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            color: 'var(--color-text-muted)',
          }}
        >
          {milestone.labelFr}
        </p>
      </div>
    </motion.div>
  );
}

export function MilestoneToast() {
  const { pendingMilestones, clearPendingMilestones } = useProgressionStore();
  const [visible, setVisible] = useState<Milestone[]>([]);

  // Synchroniser avec les jalons en attente (asynchrone pour éviter setState synchrone dans effet)
  useEffect(() => {
    if (pendingMilestones.length > 0) {
      const toAdd = [...pendingMilestones];
      queueMicrotask(() => {
        setVisible((prev) => [...prev, ...toAdd]);
        clearPendingMilestones();
      });
    }
  }, [pendingMilestones, clearPendingMilestones]);

  function dismiss(id: string) {
    setVisible((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {visible.map((milestone) => (
          <div key={milestone.id} style={{ pointerEvents: 'auto' }}>
            <SingleToast
              milestone={milestone}
              onDismiss={() => dismiss(milestone.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
