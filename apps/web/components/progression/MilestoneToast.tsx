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
import { useLocale, useTranslations } from 'next-intl';
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
  const t = useTranslations('progression');
  const locale = useLocale();

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
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        maxWidth: 320,
        boxShadow:
          '0 4px 20px color-mix(in srgb, var(--color-accent) 15%, transparent)',
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
          {t('milestoneUnlocked')}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            color: 'var(--color-text-muted)',
          }}
        >
          {locale === 'fr' ? milestone.labelFr : milestone.labelEn}
        </p>
      </div>
    </motion.div>
  );
}

export function MilestoneToast() {
  const { pendingMilestones, clearPendingMilestones } = useProgressionStore();
  const [visible, setVisible] = useState<Milestone[]>([]);

  // Synchroniser avec les jalons en attente.
  //
  // runAfterSession (useProgressionCheck.ts) lit puis réécrit le profil en
  // IndexedDB sans verrou : deux sessions terminées coup sur coup (le mode
  // Apprentissage relance une série immédiatement après chaque fin) peuvent
  // toutes les deux lire le profil avant que l'une n'ait sauvegardé, et
  // toutes les deux concluent que le même jalon vient d'être débloqué. Le
  // filtre ci-dessous absorbe ce doublon ici plutôt qu'en amont : c'est le
  // seul endroit où milestone.id devient une clé React, donc le seul qui a
  // vraiment besoin de garantir l'unicité.
  useEffect(() => {
    if (pendingMilestones.length > 0) {
      setVisible((prev) => {
        // Deux appels concurrents à addPendingMilestones (la vraie course en
        // amont) peuvent aussi bien dupliquer un id DANS un même batch
        // pendingMilestones qu'entre deux batches successifs : le filtre
        // doit couvrir les deux, pas seulement ce qui est déjà affiché.
        const seen = new Set(prev.map((m) => m.id));
        const fresh: Milestone[] = [];
        for (const milestone of pendingMilestones) {
          if (seen.has(milestone.id)) continue;
          seen.add(milestone.id);
          fresh.push(milestone);
        }
        return [...prev, ...fresh];
      });
      clearPendingMilestones();
    }
    // clearPendingMilestones est stable (Zustand action), pas besoin de la déclarer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMilestones]);

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
