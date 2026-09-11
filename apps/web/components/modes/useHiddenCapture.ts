'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Capture des caractères réellement saisis via un `<input>` caché hors écran, sur
 * le même patron que le puits de capture de `TypingArea` (mémoire
 * `project_typing_input_capture`) : focus délégué au conteneur, lecture sur
 * `input` / `compositionend` (les touches mortes AZERTY ne se composent que sur
 * un élément éditable), normalisation NFC, insertion de texte tapé uniquement
 * (ni collage, ni glisser). Jamais de listener `keydown` de texte.
 *
 * Le consommateur pose `containerRef` sur son conteneur et rend, à l'intérieur,
 * un `<input>` portant `inputRef` (voir `LevelTeachStep` pour le gabarit).
 */
export function useHiddenCapture(onChar: (nfcChar: string) => void): {
  containerRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const composedRecentlyRef = useRef(false);

  // `onChar` peut changer d'identité à chaque rendu ; le passer par un ref évite
  // de détacher/rattacher les listeners natifs.
  const onCharRef = useRef(onChar);
  useEffect(() => {
    onCharRef.current = onChar;
  });

  const commit = useCallback((raw: string) => {
    // NFC : une touche morte peut livrer un caractère décomposé (« e » + U+0302)
    // selon l'IME ; les `char` du curriculum, eux, sont en NFC.
    const char = raw.normalize('NFC');
    if (char) onCharRef.current(char);
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusCapture = () => {
      const el = inputRef.current;
      if (el && document.activeElement !== el) el.focus();
    };

    const onCompositionEnd = (e: Event) => {
      const data = (e as CompositionEvent).data || '';
      if (inputRef.current) inputRef.current.value = '';
      if (!data) return;
      composedRecentlyRef.current = true;
      queueMicrotask(() => {
        composedRecentlyRef.current = false;
      });
      for (const ch of data) commit(ch);
    };

    const onInput = (e: Event) => {
      const ie = e as InputEvent;
      // Intermédiaire de composition : on attend `compositionend`.
      if (ie.isComposing) return;
      // `input` résiduel juste après une composition validée : déjà compté.
      if (composedRecentlyRef.current) {
        composedRecentlyRef.current = false;
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      // Insertion de texte tapé seulement : ni collage, ni glisser (pas de
      // triche par injection).
      if (ie.inputType && ie.inputType !== 'insertText') {
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      const value = ie.data ?? inputRef.current?.value ?? '';
      if (inputRef.current) inputRef.current.value = '';
      if (!value) return;
      for (const ch of value) commit(ch);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.target !== inputRef.current) {
        e.preventDefault(); // empêche le conteneur de prendre le focus
        focusCapture();
      }
    };

    container.addEventListener('compositionend', onCompositionEnd);
    container.addEventListener('input', onInput);
    container.addEventListener('mousedown', onMouseDown);
    if (inputRef.current) inputRef.current.value = '';
    focusCapture();

    return () => {
      container.removeEventListener('compositionend', onCompositionEnd);
      container.removeEventListener('input', onInput);
      container.removeEventListener('mousedown', onMouseDown);
    };
  }, [commit]);

  return { containerRef, inputRef };
}
