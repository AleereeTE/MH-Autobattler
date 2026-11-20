import { TICKS_PER_SECOND } from '../../combat/index.ts';
import type { Frame, Replay } from '../../render/replay.ts';

/** Rejoue un combat déjà simulé, image par image, à la vitesse choisie. */
export class ReplayPlayer {
  private replay: Replay | null = null;
  private tick = 0;
  private playing = false;
  private lastTime = 0;
  speed = 1;
  private readonly onFrame: (frame: Frame) => void;
  private readonly onStateChange: () => void;

  constructor(onFrame: (frame: Frame) => void, onStateChange: () => void) {
    this.onFrame = onFrame;
    this.onStateChange = onStateChange;
  }

  get isLoaded(): boolean {
    return this.replay !== null;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  get currentTick(): number {
    return this.tick;
  }

  load(replay: Replay): void {
    this.replay = replay;
    this.tick = 0;
    this.play();
  }

  play(): void {
    if (this.replay === null) return;
    if (this.tick >= this.replay.durationTicks) this.tick = 0;
    this.playing = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
    this.onStateChange();
  }

  pause(): void {
    this.playing = false;
    this.onStateChange();
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  stop(): void {
    this.playing = false;
    this.replay = null;
    this.onStateChange();
  }

  /** Affiche l'image courante sans faire avancer le temps. */
  redraw(): void {
    if (this.replay !== null) this.onFrame(this.replay.frameAt(this.tick));
  }

  private readonly loop = (time: number): void => {
    if (!this.playing || this.replay === null) return;
    const elapsed = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.tick = Math.min(this.replay.durationTicks, this.tick + elapsed * TICKS_PER_SECOND * this.speed);
    this.onFrame(this.replay.frameAt(this.tick));

    if (this.tick >= this.replay.durationTicks) {
      this.pause();
      return;
    }
    requestAnimationFrame(this.loop);
  };
}
