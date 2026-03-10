'use client';

/**
 * useSyncCloud — hook de synchronisation cloud pour comptes premium.
 *
 * Déclenche la sync bidirectionnelle IndexedDB ↔ Supabase au démarrage
 * et expose un trigger manuel.
 *
 * S'active uniquement pour les users premium authentifiés.
 * N'affecte jamais l'UX en cas d'erreur réseau — mode local-first garanti.
 *
 * Client Component justifié : Supabase browser client, IndexedDB.
 * Spec : docs/ARCHITECTURE.md — local-first, Supabase uniquement premium
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { syncAll, type SyncResult } from '@/lib/sync';
import { useCallback, useEffect, useRef, useState } from 'react';

export type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';

interface UseSyncCloudReturn {
  status: SyncStatus;
  lastResult: SyncResult | null;
  /** Déclenche manuellement une sync complète. */
  sync: () => Promise<void>;
}

export function useSyncCloud(
  userId: string | null,
  isPremium: boolean,
): UseSyncCloudReturn {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const isSyncingRef = useRef(false);

  const supabase = getSupabaseBrowserClient();

  const sync = useCallback(async () => {
    if (!userId || !isPremium || !supabase || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setStatus('syncing');

    try {
      const result = await syncAll(supabase, userId);
      setLastResult(result);
      setStatus(result.errors > 0 ? 'error' : 'done');
    } catch {
      setStatus('error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [userId, isPremium, supabase]);

  // Sync automatique au montage du composant (login / démarrage app)
  useEffect(() => {
    if (userId && isPremium) {
      void sync();
    }
  }, [userId, isPremium, sync]);

  return { status, lastResult, sync };
}
