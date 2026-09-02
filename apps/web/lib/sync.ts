/**
 * lib/sync.ts — Synchronisation bidirectionnelle IndexedDB ↔ Supabase.
 *
 * Architecture local-first :
 * - IndexedDB est toujours la source de vérité locale.
 * - Supabase est une couche de sync OPTIONNELLE réservée aux users premium.
 * - La sync ne bloque jamais l'UX — elle s'exécute en arrière-plan.
 * - En cas d'erreur réseau, on continue en mode local silencieusement.
 *
 * Stratégie de résolution de conflits : last-write-wins (timestamp).
 *
 * Tant que `SYNC_IS_COMING_SOON` est vrai, toute la couche est court-circuitée
 * ici, au point d'entrée : aucun appel Supabase n'est émis (la table
 * `user_sessions` n'existe pas encore côté serveur). Le flag retiré, la sync
 * reprend sans autre changement.
 *
 * Spec : docs/ARCHITECTURE.md — Supabase uniquement pour premium
 * Spec : docs/specs/00-project-overview.md — local-first
 *
 * 'use client' implicite — ne pas importer depuis Server Components.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionResult } from '@typewav/types';
import { getSessionById, getSessions, saveSession } from './db';
import { SYNC_IS_COMING_SOON } from './featureFlags';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncResult {
  pushed: number;
  pulled: number;
  errors: number;
}

/** Ligne stockée dans la table Supabase `user_sessions`. */
interface CloudSession {
  id: string;
  user_id: string;
  timestamp: number;
  raw_data: SessionResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Récupère tous les IDs de sessions stockés sur Supabase pour cet user.
 * Retourne un Set<string> pour comparaison O(1).
 */
async function getCloudSessionIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('user_id', userId);

  if (error || !data) return new Set();
  return new Set(data.map((row: { id: string }) => row.id));
}

// ─── Push : local → cloud ─────────────────────────────────────────────────────

/**
 * Pousse les sessions locales absentes de Supabase.
 * @returns Le nombre de sessions poussées.
 */
async function pushToCloud(
  supabase: SupabaseClient,
  userId: string,
  cloudIds: Set<string>,
): Promise<number> {
  const localSessions = await getSessions();
  const toSync = localSessions.filter((s) => !cloudIds.has(s.id));

  if (toSync.length === 0) return 0;

  const rows: CloudSession[] = toSync.map((s) => ({
    id: s.id,
    user_id: userId,
    timestamp: s.timestamp,
    raw_data: s,
  }));

  // Upsert par batch de 50 pour éviter les payloads trop lourds
  const BATCH = 50;
  let pushed = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('user_sessions')
      .upsert(batch, { onConflict: 'id' });
    if (!error) pushed += batch.length;
  }

  return pushed;
}

// ─── Pull : cloud → local ─────────────────────────────────────────────────────

/**
 * Tire les sessions présentes sur Supabase mais absentes localement.
 * Stratégie last-write-wins au niveau de la session (pas de merge intra-session).
 * @returns Le nombre de sessions tirées.
 */
async function pullFromCloud(
  supabase: SupabaseClient,
  userId: string,
  cloudIds: Set<string>,
): Promise<number> {
  if (cloudIds.size === 0) return 0;

  // On cherche les IDs cloud qui ne sont pas en local
  const localSessions = await getSessions();
  const localIds = new Set(localSessions.map((s) => s.id));
  const missingIds = [...cloudIds].filter((id) => !localIds.has(id));

  if (missingIds.length === 0) return 0;

  // Charger les sessions manquantes depuis Supabase
  const { data, error } = await supabase
    .from('user_sessions')
    .select('raw_data')
    .eq('user_id', userId)
    .in('id', missingIds);

  if (error || !data) return 0;

  let pulled = 0;
  for (const row of data as { raw_data: SessionResult }[]) {
    if (row.raw_data?.id) {
      const existing = await getSessionById(row.raw_data.id);
      if (!existing) {
        await saveSession(row.raw_data);
        pulled++;
      }
    }
  }

  return pulled;
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * Synchronise dans les deux sens IndexedDB ↔ Supabase.
 *
 * Appelé après login ou au démarrage si l'user est premium.
 * Ne throw jamais — les erreurs sont capturées et retournées dans `SyncResult.errors`.
 */
export async function syncAll(
  supabase: SupabaseClient,
  userId: string,
): Promise<SyncResult> {
  const result: SyncResult = { pushed: 0, pulled: 0, errors: 0 };

  // Sync cloud pas encore en service : ne rien émettre vers Supabase.
  if (SYNC_IS_COMING_SOON) return result;

  try {
    const cloudIds = await getCloudSessionIds(supabase, userId);
    result.pushed = await pushToCloud(supabase, userId, cloudIds);
    result.pulled = await pullFromCloud(supabase, userId, cloudIds);
  } catch {
    result.errors++;
  }

  return result;
}

/**
 * Pousse une seule session vers Supabase après une partie.
 * Appel non-bloquant — utilisé depuis useSession après saveSession().
 */
export async function pushSession(
  supabase: SupabaseClient,
  userId: string,
  session: SessionResult,
): Promise<void> {
  // Sync cloud pas encore en service : ne rien émettre vers Supabase.
  if (SYNC_IS_COMING_SOON) return;

  const row: CloudSession = {
    id: session.id,
    user_id: userId,
    timestamp: session.timestamp,
    raw_data: session,
  };

  await supabase.from('user_sessions').upsert(row, { onConflict: 'id' });
}
