'use client';

/**
 * DataManagement : export / import de toutes les données locales, dans
 * /parametres. Local-first : la progression vit dans IndexedDB sur cet appareil.
 * Spec : docs/superpowers/specs/2026-09-03-remove-accounts-v1-design.md
 */

import { exportAll, importAll } from '@/lib/db';
import { Download, HardDrive, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

function reloadPage() {
  window.location.reload();
}

export function DataManagement({
  onImported = reloadPage,
}: {
  /** Appelé après un import réussi. Défaut : recharge la page. */
  onImported?: () => void;
}) {
  const t = useTranslations('settings');
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function handleExport() {
    setError(false);
    const dump = await exportAll();
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `typewav-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    // Révoquer au tick suivant : révoquer dans la foulée du click() annule
    // parfois le téléchargement (Safari surtout).
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permet de re-sélectionner le même fichier
    if (!file) return;
    if (!window.confirm(t('dataImportConfirm'))) return;

    setBusy(true);
    setError(false);
    try {
      await importAll(await file.text());
      setBusy(false);
      onImported();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-mono mb-4 border-b border-[var(--color-border)] pb-2">
        <HardDrive className="w-4 h-4" />
        <h2 className="text-lg">{t('dataGroup')}</h2>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full group">
        <div className="flex flex-col gap-1 max-w-xl">
          <h3 className="font-mono text-sm text-[var(--color-text-primary)]">
            {t('dataTitle')}
          </h3>
          <p className="font-ui text-xs text-[var(--color-text-muted)] leading-relaxed">
            {t('dataOnDevice')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs transition-colors bg-[var(--color-surface)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <Download className="w-3 h-3" />
            {t('dataExport')}
          </button>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs transition-colors bg-[var(--color-surface)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-3 h-3" />
            {t('dataImport')}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleFile}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-mono text-[var(--color-error)] mt-2">
          {t('dataImportError')}
        </p>
      )}
    </div>
  );
}
