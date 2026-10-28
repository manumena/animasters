import { beforeEach, expect, it, vi } from 'vitest';
import { RoomAudio } from './audio';

// Minimal Web Audio doubles expose scheduled times without real speakers or timers.
interface FakeSource {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  buffer: unknown;
  onended?: () => void;
}

const sources: FakeSource[] = [];
class FakeContext {
  currentTime = 10;
  state = 'suspended';
  destination = {};
  onstatechange?: () => void;
  resume = vi.fn(async () => { this.state = 'running'; });
  close = vi.fn(async () => {});
  createGain = () => ({ connect: vi.fn(), gain: { value: 1 } });
  decodeAudioData = vi.fn(async () => ({ duration: 90 }));
  createBufferSource() {
    const source: FakeSource = {
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      buffer: null,
    };
    sources.push(source);
    return source;
  }
}
const round = { id: 'one', number: 1, total: 40, startsAt: 20_000, audioUrl: 'https://audio.example/one' };
beforeEach(() => {
  sources.length = 0;
  vi.stubGlobal('AudioContext', FakeContext);
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(new ArrayBuffer(8)));
});

it('schedules from the shared server time, never just from message arrival', async () => {
  const audio = new RoomAudio();
  await audio.enable();
  await audio.prepare(round, () => 15_000);
  expect(sources[0].start).toHaveBeenCalledWith(15, 0);
  await audio.prepare(round, () => 15_010);
  expect(sources).toHaveLength(1);
  audio.dispose();
});

it('preserves a paused song across snapshots and supports local replay', async () => {
  const audio = new RoomAudio();
  await audio.enable();
  await audio.prepare(round, () => 21_000);
  audio.pause();
  await audio.prepare({ ...round, deadline: 30_000 }, () => 22_000);
  expect(sources).toHaveLength(1);
  audio.replay();
  expect(sources).toHaveLength(2);
  expect(sources[1].start).toHaveBeenCalledWith(10, 0);
  audio.dispose();
});

it('cancels a pending start when everyone disconnects, then schedules the resumed start', async () => {
  const audio = new RoomAudio();
  await audio.enable();
  await audio.prepare(round, () => 15_000);
  audio.cancelScheduled();
  expect(sources[0].stop).toHaveBeenCalled();
  await audio.prepare({ ...round, startsAt: 30_000 }, () => 22_000);
  expect(sources[1].start).toHaveBeenCalledWith(18, 0);
  audio.dispose();
});

it('does not play before audio is enabled and can enable after refreshing mid-round', async () => {
  const audio = new RoomAudio();
  await audio.prepare(round, () => 21_000);
  expect(sources).toHaveLength(0);
  await audio.enable();
  expect(sources[0].start).toHaveBeenCalledWith(10, 0);
  audio.dispose();
});

it('reports failed audio without scheduling the previous song for a new round', async () => {
  const audio = new RoomAudio();
  await audio.enable();
  await audio.prepare(round, () => 15_000);
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));
  await audio.prepare({ ...round, id: 'two', audioUrl: 'https://audio.example/two' }, () => 21_000);
  expect(audio.getSnapshot().error).toContain('could not be loaded');
  expect(sources).toHaveLength(1);
  expect(sources[0].stop).toHaveBeenCalled();
  audio.dispose();
});

it('stops the audible song at the earlier boundary when everyone becomes ready', async () => {
  const audio = new RoomAudio();
  await audio.enable();
  await audio.prepare(round, () => 21_000);

  // The previous song is audible while the next song waits for its countdown.
  const nextRound = { ...round, id: 'two', startsAt: 31_000 };
  await audio.prepare(nextRound, () => 21_000);
  expect(sources[0].stop).toHaveBeenLastCalledWith(20);

  await audio.prepare({ ...nextRound, startsAt: 21_500 }, () => 21_000);
  expect(sources[0].stop).toHaveBeenLastCalledWith(10.5);
  expect(sources[1].stop).toHaveBeenLastCalledWith(10);
  expect(sources[2].start).toHaveBeenCalledWith(10.5, 0);

  // Pause must also stop the old song if the new start is still in the future.
  audio.pause();
  expect(sources[0].stop).toHaveBeenLastCalledWith(10);
  expect(sources[2].stop).toHaveBeenLastCalledWith(10);
  audio.replay();
  expect(sources[1].stop).toHaveBeenCalledTimes(1);

  // Ending an obsolete source releases it without changing the replacement's playhead.
  sources[0].onended?.();
  expect(sources[0].disconnect).toHaveBeenCalled();
  expect(audio.position()).toBe(0);
  audio.dispose();
});

it('updates the old song cutoff even while the next download is pending', async () => {
  const audio = new RoomAudio();
  await audio.enable();
  await audio.prepare(round, () => 21_000);

  let finishDownload!: (response: Response) => void;
  vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => {
    finishDownload = resolve;
  }));
  const nextRound = { ...round, id: 'two', startsAt: 31_000 };
  const preparation = audio.prepare(nextRound, () => 21_000);
  await audio.prepare({ ...nextRound, startsAt: 21_500 }, () => 21_000);
  expect(sources[0].stop).toHaveBeenLastCalledWith(10.5);

  // A failed download must not let the previous track continue into this round.
  finishDownload(new Response(null, { status: 503 }));
  await preparation;
  expect(sources).toHaveLength(1);
  expect(audio.getSnapshot().error).toContain('could not be loaded');
  audio.dispose();
});
