import { describe, expect, it } from 'vitest';
import type { InstrumentType } from '../soundpack';

describe('InstrumentType', () => {
  it("'piano' est assignable à InstrumentType", () => {
    // Vérifie à la fois la valeur runtime et la validité TypeScript (via typecheck)
    const t: InstrumentType = 'piano';
    expect(t).toBe('piano');
  });
});
