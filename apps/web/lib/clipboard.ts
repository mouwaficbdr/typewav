/**
 * copyText : copie robuste dans le presse-papier.
 *
 * Essaie d'abord l'API asynchrone (navigator.clipboard.writeText), puis
 * retombe sur execCommand('copy') via un textarea temporaire quand la
 * première échoue (contexte non sécurisé, permission refusée, document sans
 * focus, iframe restreinte...). Renvoie true si l'une des deux a abouti.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.clipboard?.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // API async indisponible ou refusée : on tente le repli ci-dessous.
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
