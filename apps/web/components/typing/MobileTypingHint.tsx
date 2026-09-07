'use client';

/**
 * MobileTypingHint : bandeau discret, non bloquant, affiché uniquement sous
 * ~600px de large (visibilité pilotée en CSS, voir `.mobile-typing-hint` dans
 * globals.css — pas de listener de resize). TypeWav vise le clavier physique ;
 * ce bandeau pose l'attente sans empêcher de taper.
 *
 * Rejet mémorisé dans IndexedDB (`user_preferences`), donc il ne revient plus
 * sur l'appareil. `dismissed === null` = lecture IndexedDB en cours : on ne rend
 * rien (server + 1er paint client identiques, pas de mismatch d'hydratation).
 */

import { getPreference, setPreference } from '@/lib/db';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { CloseIcon } from '../ui/icons';

const DISMISS_KEY = 'mobile_typing_hint_dismissed';

export function MobileTypingHint() {
  const t = useTranslations('typing');
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    getPreference<boolean>(DISMISS_KEY)
      .then((v) => setDismissed(v === true))
      .catch(() => setDismissed(false));
  }, []);

  if (dismissed !== false) return null;

  return (
    <div
      className="mobile-typing-hint"
      role="note"
      style={{
        // `display:flex` porté aussi en inline : la classe ne pilote que la
        // visibilité selon la largeur, pas la disposition texte + bouton.
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        background: 'color-mix(in srgb, var(--color-surface) 60%, transparent)',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8rem',
        lineHeight: 1.4,
      }}
    >
      <span style={{ flex: 1 }}>{t('desktopHint')}</span>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          void setPreference(DISMISS_KEY, true).catch(() => undefined);
        }}
        aria-label={t('desktopHintDismiss')}
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
        <CloseIcon size={16} />
      </button>
    </div>
  );
}
