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
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4">
        <HardDrive className="w-6 h-6 text-[var(--color-accent)]" />
        <h2 className="font-ui text-2xl font-semibold text-[var(--color-text-primary)]">
          {t('dataTitle')}
        </h2>
      </div>

      <p className="text-[var(--color-text-muted)]">{t('dataOnDevice')}</p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
        >
          <Download className="w-4 h-4" />
          {t('dataExport')}
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-text-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
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

      {error && (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {t('dataImportError')}
        </p>
      )}
    </section>
  );
}
