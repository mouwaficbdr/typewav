'use client';

/**
 * BottomSheet : feuille modale qui monte du bas. Rendue via un portail dans
 * `document.body` (l'écran de frappe a des ancêtres avec `transform`, qui
 * casseraient un `position: fixed` descendant — même raison que
 * ThemeQuickSwitcher).
 *
 * - Fond assombri, coins arrondis en haut, poignée de glisse.
 * - Fermeture : clic sur le fond, Échap, glisse vers le bas au-delà d'un seuil.
 * - Focus déplacé dans la feuille à l'ouverture, piège Tab minimal, focus rendu
 *   au déclencheur à la fermeture.
 * - `overscroll-behavior: contain`, verrou du scroll body, `prefers-reduced-
 *   motion` (pas de glissement, bascule directe).
 *
 * Le contenu défile à l'intérieur (`max-height` ~85svh).
 */

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './icons';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Bouton de fermeture explicite en tête (en plus du fond / Échap / glisse). */
  showCloseButton?: boolean;
  children: React.ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  showCloseButton = true,
  children,
}: BottomSheetProps) {
  const shouldReduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const labelId = useId();

  // Échap ferme.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  // Verrou du scroll body + focus.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Laisse l'animation d'entrée démarrer avant de bouger le focus.
    const id = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Piège Tab minimal : garde le focus dans la feuille.
  const onKeyDownTrap = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="bottom-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'color-mix(in srgb, black 55%, transparent)',
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDownTrap}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', damping: 32, stiffness: 340 }
            }
            drag={shouldReduceMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose();
            }}
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '85svh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--color-surface)',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)',
              boxShadow: '0 -8px 40px color-mix(in srgb, black 45%, transparent)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              overscrollBehavior: 'contain',
              touchAction: 'pan-y',
            }}
          >
            {/* Poignée de glisse */}
            <div
              aria-hidden="true"
              style={{
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'center',
                padding: '10px 0 4px',
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 999,
                  background:
                    'color-mix(in srgb, var(--color-text-muted) 45%, transparent)',
                }}
              />
            </div>

            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '4px 16px 12px',
              }}
            >
              <h2
                id={labelId}
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                {title}
              </h2>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={title ? `${title} — fermer` : 'Fermer'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  className="hover:text-[var(--color-text-primary)]"
                >
                  <CloseIcon size={18} />
                </button>
              )}
            </div>

            <div
              style={{
                minHeight: 0,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                padding: '0 16px 16px',
              }}
              className="hide-scrollbar"
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
