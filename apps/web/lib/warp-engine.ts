import type { ParsedNote } from '@typewav/audio-engine';

class WarpEngine {
  private readonly TAU_MS = 300;
  private readonly WPM_TO_BPM_FACTOR = 2.5;
  private readonly MIN_BPM = 20;
  private readonly MAX_BPM = 300;

  private currentBpm = 80;
  private lastKeystrokeTime = 0;
  private keystrokeTimes: number[] = [];

  onKeystroke(): void {
    const now = performance.now();
    this.keystrokeTimes.push(now);

    if (this.keystrokeTimes.length > 8) {
      this.keystrokeTimes.shift();
    }

    this.lastKeystrokeTime = now;
    this.updateBpm();
  }

  private updateBpm(): void {
    if (this.keystrokeTimes.length < 2) return;

    const intervals: number[] = [];
    for (let i = 1; i < this.keystrokeTimes.length; i++) {
      intervals.push(this.keystrokeTimes[i]! - this.keystrokeTimes[i - 1]!);
    }

    const avgIntervalMs =
      intervals.reduce((sum, value) => sum + value, 0) / intervals.length;

    if (avgIntervalMs <= 0) return;

    const charsPerMinute = 60000 / avgIntervalMs;
    const wpm = charsPerMinute / 5;

    const targetBpm = Math.min(
      this.MAX_BPM,
      Math.max(this.MIN_BPM, wpm * this.WPM_TO_BPM_FACTOR),
    );

    const dt = this.lastKeystrokeTime > 0 ? avgIntervalMs : this.TAU_MS;
    const alphaTau = 1 - Math.exp(-dt / this.TAU_MS);
    const alpha = Math.max(0.1, Math.min(0.5, alphaTau));

    this.currentBpm = this.currentBpm + alpha * (targetBpm - this.currentBpm);
  }

  getNoteDuration(note: ParsedNote, pieceReferenceBpm: number): number {
    const safeCurrentBpm = Math.max(this.MIN_BPM, this.currentBpm);
    const safeReferenceBpm = pieceReferenceBpm > 0 ? pieceReferenceBpm : 120;

    const ratio = safeReferenceBpm / safeCurrentBpm;
    return Math.max(0.03, note.durationSec * ratio);
  }

  getCurrentBpm(): number {
    return this.currentBpm;
  }

  reset(defaultBpm = 80): void {
    this.currentBpm = Math.min(
      this.MAX_BPM,
      Math.max(this.MIN_BPM, defaultBpm),
    );
    this.keystrokeTimes = [];
    this.lastKeystrokeTime = 0;
  }
}

export const warpEngine = new WarpEngine();
