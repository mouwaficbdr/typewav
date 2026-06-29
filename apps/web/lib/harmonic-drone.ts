type DisposableSynth = {
  triggerAttack: (note: string, time?: number) => void;
  triggerRelease: (time?: number) => void;
  dispose: () => void;
};

class HarmonicDrone {
  private drone: DisposableSynth | null = null;
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;
  private isActive = false;

  async start(tonicPitch: number): Promise<void> {
    await this.stop();

    const Tone = await import('tone');

    const drone = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 0, sustain: 1, release: 3 },
      volume: -24,
    }).toDestination() as unknown as DisposableSynth;

    const tonicNote = Tone.Frequency(tonicPitch, 'midi').toNote();
    drone.triggerAttack(tonicNote);

    this.drone = drone;
    this.isActive = true;
  }

  async stop(): Promise<void> {
    if (!this.drone) {
      this.isActive = false;
      return;
    }

    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }

    const drone = this.drone;
    drone.triggerRelease();

    this.releaseTimer = setTimeout(() => {
      try {
        drone.dispose();
      } catch {
        // Ignore dispose errors during cleanup.
      }
    }, 3000);

    this.drone = null;
    this.isActive = false;
  }

  get active(): boolean {
    return this.isActive;
  }
}

export const harmonicDrone = new HarmonicDrone();
