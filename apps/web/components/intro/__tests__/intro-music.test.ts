import { describe, expect, it, vi } from 'vitest';
import {
  FINAL_CHORD,
  INTRO_MELODY,
  SAMPLER_WAIT_MS,
  STAFF_PHRASE,
  playChord,
} from '../intro-music';

describe('intro-music', () => {
  it('INTRO_MELODY : la suite écrite de « les notes », notes du fichier fur_Elise_WoO59.mid', () => {
    expect(INTRO_MELODY).toEqual([
      ['E5'],
      ['D#5'],
      ['E5'],
      ['D#5'],
      ['E5'],
      ['B4'],
      ['D5'],
      ['C5'],
      ['A4', 'A2'],
    ]);
  });

  it('STAFF_PHRASE : la phrase des six notes de la portée, une par écran', () => {
    expect(STAFF_PHRASE).toEqual(['C4', 'E4', 'G4', 'A4', 'G4', 'C5']);
  });

  it("FINAL_CHORD : l'accord de conclusion sur l'écran 6", () => {
    expect(FINAL_CHORD).toEqual(['C4', 'E4', 'G4', 'C5']);
  });

  it('SAMPLER_WAIT_MS vaut 8 secondes', () => {
    expect(SAMPLER_WAIT_MS).toBe(8000);
  });

  it("playChord ne joue rien quand le piano n'est pas prêt (jamais de synthé)", async () => {
    const play = vi.fn();
    expect(await playChord(['C4'], play, () => false)).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });

  it('playChord joue chaque note et renvoie true quand le piano est prêt', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    expect(await playChord(['C4', 'E4', 'G4'], play, () => true)).toBe(true);
    expect(play).toHaveBeenCalledTimes(3);
    expect(play).toHaveBeenCalledWith('C4');
    expect(play).toHaveBeenCalledWith('E4');
    expect(play).toHaveBeenCalledWith('G4');
  });
});
