/**
 * lib/challenge.ts : encodage et décodage de challenges directs via URL.
 *
 * Tout dans l'URL, sans serveur. URL max 2048 chars.
 * Format : /challenge?c={base64url(ChallengeParams)}
 *
 * Spec : docs/specs/08-10-social-analytics-extensibility.md (Challenge direct)
 */

import type { ChallengeParams } from '@typewav/types';

const CHALLENGE_PREFIX = '/challenge?c=';
const MAX_URL_BYTES = 2048;
/** Longueur maximale du texte encodable dans l'URL */
const MAX_TEXT_LENGTH = 300;

/**
 * Encode des ChallengeParams en base64url.
 */
export function encodeChallenge(params: ChallengeParams): string {
  const json = JSON.stringify(params);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

/**
 * Décode un base64url en ChallengeParams.
 * Lève une erreur si le payload est invalide.
 */
export function decodeChallenge(encoded: string): ChallengeParams {
  const bytes = base64UrlToBytes(encoded);
  const json = new TextDecoder().decode(bytes);
  const parsed: unknown = JSON.parse(json);
  if (!isChallengeParams(parsed)) {
    throw new Error('Invalid challenge data');
  }
  return parsed;
}

/**
 * Génère un lien de challenge depuis un texte + params.
 * Rogne le texte par paliers pour tenir dans MAX_URL_BYTES. Si même un texte
 * vide ne suffit pas (baseUrl volumineux, params anormaux), renvoie le meilleur
 * effort plutôt que de boucler.
 */
export function generateChallengeLink(
  text: string,
  params: Omit<ChallengeParams, 'textHash' | 'textB64'>,
  baseUrl = '',
): string {
  let effective = text.slice(0, MAX_TEXT_LENGTH);

  // Chaque passe retire au moins un caractère (via `effective.length - 1`) et
  // s'arrête à zéro : au plus MAX_TEXT_LENGTH passes, jamais de récursion.
  while (true) {
    const textB64 = bytesToBase64Url(new TextEncoder().encode(effective));
    const full: ChallengeParams = {
      ...params,
      textHash: hashText(effective),
      textB64,
    };
    const url = `${baseUrl}${CHALLENGE_PREFIX}${encodeChallenge(full)}`;

    if (url.length <= MAX_URL_BYTES || effective.length === 0) {
      return url;
    }

    const nextLength = Math.min(
      effective.length - 1,
      Math.floor(effective.length * 0.6),
    );
    effective = effective.slice(0, nextLength);
  }
}

/**
 * Extrait le texte depuis un ChallengeParams décodé.
 */
export function getChallengeText(params: ChallengeParams): string {
  const bytes = base64UrlToBytes(params.textB64);
  return new TextDecoder().decode(bytes);
}

/**
 * Hash djb2 simplifié : 8 chars hex, suffisant pour vérifier l'intégrité du texte.
 */
export function hashText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
    hash = hash >>> 0; // forcer uint32
  }
  return hash.toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// Helpers base64url
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

function isChallengeParams(v: unknown): v is ChallengeParams {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c['textHash'] === 'string' &&
    typeof c['textB64'] === 'string' &&
    typeof c['duration'] === 'number' &&
    typeof c['mode'] === 'string'
  );
}
