'use client';

/**
 * PersonalTextsPanel : gestion complète des textes personnels (mode Libre).
 *
 * Premier modal "maison" du projet (aucun composant modal générique
 * n'existait encore) : overlay + panneau, fermeture Échap/clic extérieur,
 * focus posé sur le panneau à l'ouverture.
 */

import { deletePersonalText, savePersonalText, type PersonalText } from '@/lib/db';
import { useCustomTextStore } from '@/stores/useCustomTextStore';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { CloseIcon, PlusIcon, TrashIcon } from '../ui/icons';

interface PersonalTextsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  personalTexts: PersonalText[];
  onChange: () => void;
}

export function PersonalTextsPanel({
  isOpen,
  onClose,
  personalTexts,
  onChange,
}: PersonalTextsPanelProps) {
  const t = useTranslations('typing.personalTexts');
  const setActivePersonalTextId = useCustomTextStore(
    (s) => s.setActivePersonalTextId,
  );
  const [draft, setDraft] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUse = (id: string) => {
    setActivePersonalTextId(id);
    onClose();
  };

  const handleDelete = async (id: string) => {
    await deletePersonalText(id);
    onChange();
  };

  const handleAdd = async () => {
    const content = draft.trim();
    if (!content) return;
    const now = Date.now();
    await savePersonalText({
      id: crypto.randomUUID(),
      title: content.slice(0, 40) + (content.length > 40 ? '…' : ''),
      content,
      createdAt: now,
      lastUsed: now,
      isFavorite: false,
    });
    setDraft('');
    onChange();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, black 55%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 24,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('close')}
            title={t('close')}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              padding: 4,
            }}
            className="hover:text-text-primary transition-colors"
          >
            <CloseIcon size={16} />
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
              {t('close')}
            </span>
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          {personalTexts.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-ui)',
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
              }}
            >
              {t('empty')}
            </p>
          ) : (
            personalTexts.map((text) => (
              <div
                key={text.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '8px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {text.title}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleUse(text.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.75rem',
                      color: 'var(--color-accent)',
                      padding: '4px 8px',
                    }}
                  >
                    {t('use')}
                  </button>
                  <button
                    onClick={() => void handleDelete(text.id)}
                    aria-label={t('delete')}
                    title={t('delete')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      padding: 4,
                    }}
                    className="hover:text-text-primary transition-colors"
                  >
                    <TrashIcon size={14} />
                    <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                      {t('delete')}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('addPlaceholder')}
            rows={3}
            style={{
              width: '100%',
              resize: 'vertical',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              color: 'var(--color-text-primary)',
              background: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: 8,
            }}
          />
          <button
            onClick={() => void handleAdd()}
            disabled={draft.trim().length === 0}
            style={{
              alignSelf: 'flex-end',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--color-accent)',
              color: 'var(--color-background)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: draft.trim().length === 0 ? 'not-allowed' : 'pointer',
              opacity: draft.trim().length === 0 ? 0.5 : 1,
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8rem',
              fontWeight: 500,
              padding: '6px 12px',
            }}
          >
            <PlusIcon size={14} />
            {t('add')}
          </button>
        </div>
      </div>
    </div>
  );
}
