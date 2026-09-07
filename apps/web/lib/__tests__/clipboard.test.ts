// @vitest-environment jsdom
// (le repli execCommand a besoin d'un `document` ; le projet web-lib est en node)
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../clipboard';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

/**
 * jsdom n'implémente pas `document.execCommand` : on l'installe nous-mêmes
 * (une simple affectation suffit) et on le retire après chaque test.
 */
function stubExecCommand(returns: boolean) {
  const fn = vi.fn().mockReturnValue(returns);
  (document as unknown as { execCommand: unknown }).execCommand = fn;
  return fn;
}

afterEach(() => {
  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', originalClipboard);
  } else {
    // @ts-expect-error : nettoyage du stub de test
    delete navigator.clipboard;
  }
  delete (document as unknown as { execCommand?: unknown }).execCommand;
  vi.restoreAllMocks();
});

describe('copyText', () => {
  it('utilise navigator.clipboard.writeText quand disponible', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    const ok = await copyText('https://example.test/x');

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.test/x');
  });

  it('retombe sur execCommand quand writeText échoue', async () => {
    setClipboard({
      writeText: vi.fn().mockRejectedValue(new Error('NotAllowed')),
    });
    const exec = stubExecCommand(true);

    const ok = await copyText('texte de repli');

    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('renvoie false quand writeText échoue et execCommand échoue aussi', async () => {
    setClipboard({
      writeText: vi.fn().mockRejectedValue(new Error('NotAllowed')),
    });
    stubExecCommand(false);

    expect(await copyText('rien ne marche')).toBe(false);
  });

  it('utilise execCommand quand navigator.clipboard est absent', async () => {
    setClipboard(undefined);
    const exec = stubExecCommand(true);

    const ok = await copyText('sans api async');

    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });
});
