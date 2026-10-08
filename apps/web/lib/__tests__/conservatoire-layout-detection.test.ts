import { describe, expect, it } from 'vitest';
import {
  detectLayoutFromKey,
  detectLayoutFromNavigator,
} from '../conservatoire/layout-detection';

describe('detectLayoutFromKey', () => {
  it('reconnaît AZERTY sur les quatre positions discriminantes', () => {
    expect(detectLayoutFromKey('KeyA', 'q')).toBe('azerty');
    expect(detectLayoutFromKey('KeyQ', 'a')).toBe('azerty');
    expect(detectLayoutFromKey('KeyW', 'z')).toBe('azerty');
    expect(detectLayoutFromKey('Semicolon', 'm')).toBe('azerty');
  });

  it('reconnaît QWERTY sur les produits inverses', () => {
    expect(detectLayoutFromKey('KeyA', 'a')).toBe('qwerty');
    expect(detectLayoutFromKey('KeyQ', 'q')).toBe('qwerty');
    expect(detectLayoutFromKey('KeyW', 'w')).toBe('qwerty');
    expect(detectLayoutFromKey('Semicolon', ';')).toBe('qwerty');
  });

  it('Verr. Maj ou Maj ne faussent rien', () => {
    expect(detectLayoutFromKey('KeyA', 'Q')).toBe('azerty');
    expect(detectLayoutFromKey('KeyQ', 'Q')).toBe('qwerty');
  });

  it('une touche non discriminante ne dit rien', () => {
    expect(detectLayoutFromKey('KeyF', 'f')).toBeNull();
    expect(detectLayoutFromKey('Space', ' ')).toBeNull();
    expect(detectLayoutFromKey('KeyA', '')).toBeNull();
  });
});

describe('detectLayoutFromNavigator', () => {
  const withMap = (value: string | undefined) => ({
    keyboard: { getLayoutMap: async () => ({ get: () => value }) },
  });

  it('lit la carte de disposition quand elle existe', async () => {
    await expect(detectLayoutFromNavigator(withMap('a'))).resolves.toBe('azerty');
    await expect(detectLayoutFromNavigator(withMap('q'))).resolves.toBe('qwerty');
  });

  it("null sans API, sans valeur, ou si l'API échoue", async () => {
    await expect(detectLayoutFromNavigator({})).resolves.toBeNull();
    await expect(detectLayoutFromNavigator(withMap(undefined))).resolves.toBeNull();
    await expect(
      detectLayoutFromNavigator({
        keyboard: {
          getLayoutMap: async () => {
            throw new Error('SecurityError');
          },
        },
      }),
    ).resolves.toBeNull();
  });
});
