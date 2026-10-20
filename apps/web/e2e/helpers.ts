import { expect, type Locator, type Page } from '@playwright/test';

export async function seedPreferences(
  page: Page,
  prefs: Record<string, unknown>,
): Promise<void> {
  await page.evaluate(async (entries) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('typewav');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('user_preferences', 'readwrite');
      for (const [key, value] of Object.entries(entries)) {
        tx.objectStore('user_preferences').put(value, key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, prefs);
}

/**
 * Pose le drapeau de l'Ouverture avant de poursuivre un test qui n'en parle
 * pas : sans lui, l'Ouverture recouvre l'accueil (voir spec partie B).
 * Recharge pour que `HomeClient` relise le drapeau au montage.
 */
export async function skipIntro(page: Page): Promise<void> {
  await seedPreferences(page, { has_seen_intro_v1: true });
  await page.reload();
}

/** Lit une préférence brute depuis `user_preferences` (debug / assertions e2e). */
export async function readPreference<T>(
  page: Page,
  key: string,
): Promise<T | undefined> {
  return page.evaluate(async (k) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('typewav');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction('user_preferences', 'readonly');
      const req = tx.objectStore('user_preferences').get(k);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return value;
  }, key) as Promise<T | undefined>;
}

export type Box = { x: number; y: number; width: number; height: number };

export async function boxOf(locator: Locator, timeout?: number): Promise<Box> {
  const box = await locator.boundingBox({ ...(timeout !== undefined ? { timeout } : {}) });
  if (!box) throw new Error('element sans boite : non rendu');
  return box;
}

export function overlapArea(a: Box, b: Box): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

/** `a` est contenu (1px de tolerance) dans `b` : relation parent/enfant du DOM, pas un chevauchement. */
function isContained(a: Box, b: Box): boolean {
  const eps = 1;
  return (
    a.x >= b.x - eps &&
    a.y >= b.y - eps &&
    a.x + a.width <= b.x + b.width + eps &&
    a.y + a.height <= b.y + b.height + eps
  );
}

/**
 * Echoue si deux des elements nommes se recouvrent de plus d'1 px2. Un
 * element entierement contenu dans un autre (ex: l'ecran 2 niche son propre
 * `<Staff>` dans son conteneur, voir PlayScreen.tsx) n'est pas un
 * chevauchement : c'est une composition voulue, pas deux parts distinctes qui
 * se marchent dessus.
 * `timeout` : delai de chaque boundingBox (par defaut, celui de Playwright) ;
 * a etendre la ou une transition reelle ou un chargement reel (audio) peut
 * retarder la stabilisation du DOM.
 */
export async function expectNoOverlap(
  parts: Record<string, Locator>,
  timeout?: number,
): Promise<Map<string, Box>> {
  const boxes = new Map<string, Box>();
  for (const [name, locator] of Object.entries(parts)) {
    boxes.set(name, await boxOf(locator, timeout));
  }
  const names = [...boxes.keys()];
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const a = names[i]!;
      const b = names[j]!;
      const boxA = boxes.get(a)!;
      const boxB = boxes.get(b)!;
      if (isContained(boxA, boxB) || isContained(boxB, boxA)) continue;
      expect(
        overlapArea(boxA, boxB),
        `${a} recouvre ${b}`,
      ).toBeLessThanOrEqual(1);
    }
  }
  return boxes;
}
