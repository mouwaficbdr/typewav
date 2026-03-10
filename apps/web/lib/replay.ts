/**
 * lib/replay.ts — Génération et encodage de replays partageables.
 *
 * Le replay est stocké dans IndexedDB (personal_records.keystrokeTimings).
 * Un lien partageable encode les timings + métadonnées en base64url dans l'URL.
 * La musique est régénérée lors de la lecture depuis les timings.
 *
 * Spec : docs/specs/08-10-social-analytics-extensibility.md — Replay partageable
 */

import type { ReplayData } from '@typewav/types';

const REPLAY_PREFIX = '/replay?d=';
const MAX_URL_BYTES = 2048;

/**
 * Encode un ReplayData en base64url pour partage via URL.
 * Tronque les timings si l'URL dépasserait la limite.
 */
export function encodeReplay(data: ReplayData): string {
  const json = JSON.stringify(data);
  // btoa fonctionne uniquement avec Latin-1 — encoder en UTF-8 d'abord
  const bytes = new TextEncoder().encode(json);
  const b64 = bytesToBase64Url(bytes);
  return b64;
}

/**
 * Décode un base64url en ReplayData.
 * Lève une erreur si le payload est invalide.
 */
export function decodeReplay(encoded: string): ReplayData {
  const bytes = base64UrlToBytes(encoded);
  const json = new TextDecoder().decode(bytes);
  const parsed: unknown = JSON.parse(json);
  if (!isReplayData(parsed)) {
    throw new Error('Invalid replay data');
  }
  return parsed;
}

/**
 * Génère un lien partageable (chemin relatif).
 * Si l'URL dépasse MAX_URL_BYTES, tronque les timings.
 */
export function generateReplayLink(data: ReplayData, baseUrl = ''): string {
  let payload = data;

  // Réduire les timings si nécessaire
  while (true) {
    const encoded = encodeReplay(payload);
    const url = `${baseUrl}${REPLAY_PREFIX}${encoded}`;
    if (url.length <= MAX_URL_BYTES || payload.keystrokeTimings.length <= 10) {
      return url;
    }
    // Tronquer à 90% jusqu'à rentrer dans la limite
    const newLength = Math.floor(payload.keystrokeTimings.length * 0.9);
    payload = {
      ...payload,
      keystrokeTimings: payload.keystrokeTimings.slice(0, newLength),
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers base64url (sans dépendances)
// ---------------------------------------------------------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function isReplayData(v: unknown): v is ReplayData {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r['sessionId'] === 'string' &&
    typeof r['text'] === 'string' &&
    Array.isArray(r['keystrokeTimings']) &&
    typeof r['wpm'] === 'number' &&
    typeof r['accuracy'] === 'number' &&
    typeof r['theme'] === 'string' &&
    typeof r['soundPack'] === 'string' &&
    typeof r['achievedAt'] === 'number'
  );
}
