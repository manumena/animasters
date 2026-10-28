import type { RoundSnapshot } from './client';

interface AudioState {
  enabled: boolean;
  loading: boolean;
  duration: number;
  error?: string;
}

/** Owns browser audio only. Neither seeking nor replaying changes the server clock. */
export class RoomAudio {
  private context?: AudioContext;
  private gain?: GainNode;
  private source?: AudioBufferSourceNode;
  private buffer?: AudioBuffer;
  private round?: RoundSnapshot;
  private scheduledId?: string;
  private scheduledAt?: number;
  private startedAt = 0;
  private offset = 0;
  private playing = false;
  private request?: AbortController;
  private generation = 0;
  private serverNow: () => number = Date.now;
  private state: AudioState = { enabled: false, loading: false, duration: 0 };
  private listeners = new Set<() => void>();

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(change: Partial<AudioState>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach(listener => listener());
  }

  private audioContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.gain = this.context.createGain();
      this.gain.connect(this.context.destination);
      this.context.onstatechange = () => this.update({ enabled: this.context?.state === 'running' });
    }
    return this.context;
  }

  // Call directly from the user's click, before waiting for any network operation.
  async enable(): Promise<void> {
    const context = this.audioContext();
    await context.resume();
    if (context.state !== 'running') throw new Error('Audio is blocked. Tap Enable audio again.');
    this.update({ enabled: true, error: undefined });
    this.schedule();
  }

  async prepare(round: RoundSnapshot, serverNow: () => number): Promise<void> {
    this.serverNow = serverNow;
    const sameRound = this.round?.id === round.id;
    this.round = round;
    if (sameRound && this.buffer) {
      this.schedule();
      return;
    }
    if (sameRound && this.state.loading) return;
    // Stop the previous round at the shared boundary even if the next download fails.
    if (this.source && this.context && round.startsAt) {
      this.source.stop(this.context.currentTime + Math.max(0, (round.startsAt - serverNow()) / 1000));
    }
    this.buffer = undefined;
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    const generation = ++this.generation;
    this.update({ loading: true, error: undefined });
    try {
      const response = await fetch(round.audioUrl, { signal: request.signal });
      if (!response.ok) throw new Error('Audio could not be loaded. You can still guess or pass.');
      const decoded = await this.audioContext().decodeAudioData(await response.arrayBuffer());
      if (generation !== this.generation) return;
      this.buffer = decoded;
      this.scheduledId = undefined;
      this.update({ loading: false, duration: decoded.duration });
      this.schedule();
    } catch (error) {
      if (request.signal.aborted || generation !== this.generation) return;
      this.update({ loading: false, error: error instanceof Error ? error.message : 'Audio failed.' });
    }
  }

  private schedule() {
    if (!this.round?.startsAt || !this.buffer || !this.state.enabled) return;
    const sameRound = this.scheduledId === this.round.id;
    // Snapshot/reconnect updates must not restart a player's paused or replayed song.
    if (sameRound && (this.scheduledAt === this.round.startsAt || this.serverNow() >= this.scheduledAt!)) return;
    const delay = Math.max(0, (this.round.startsAt - this.serverNow()) / 1000);
    this.playAt(0, this.audioContext().currentTime + delay);
    this.scheduledId = this.round.id;
    this.scheduledAt = this.round.startsAt;
  }

  private playAt(offset: number, when: number) {
    const context = this.audioContext();
    if (!this.buffer || !this.state.enabled) return;
    this.source?.stop(when);
    const source = context.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.gain!);
    source.start(when, offset);
    this.source = source;
    this.offset = offset;
    this.startedAt = when;
    this.playing = true;
    source.onended = () => {
      if (this.source === source) {
        this.playing = false;
        this.offset = this.buffer?.duration ?? 0;
      }
    };
  }

  position(): number {
    if (!this.playing || !this.context) return this.offset;
    return Math.min(this.state.duration, this.offset + Math.max(0, this.context.currentTime - this.startedAt));
  }
  pause(): void {
    this.offset = this.position();
    this.playing = false;
    const source = this.source;
    this.source = undefined;
    source?.stop();
  }
  play(): void {
    this.playAt(this.offset >= this.state.duration ? 0 : this.offset, this.audioContext().currentTime);
  }
  seek(seconds: number): void {
    const playing = this.playing;
    this.pause();
    this.offset = Math.max(0, Math.min(seconds, this.state.duration));
    if (playing) this.play();
  }
  replay(): void {
    this.offset = 0;
    this.play();
  }
  volume(value: number): void {
    if (this.gain) this.gain.gain.value = value;
  }
  cancelScheduled(): void {
    if (this.scheduledAt && this.serverNow() < this.scheduledAt) {
      this.pause();
      this.scheduledId = undefined;
    }
  }
  dispose(): void {
    this.generation++;
    this.request?.abort();
    this.pause();
    if (this.context) {
      this.context.onstatechange = null;
      void this.context.close();
      this.context = undefined;
      this.buffer = undefined;
      this.round = undefined;
      this.scheduledId = undefined;
    }
  }
}
