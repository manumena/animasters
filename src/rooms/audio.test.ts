import { beforeEach, expect, it, vi } from 'vitest';
import { RoomAudio } from './audio';

const sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn>; buffer: unknown; onended?: () => void }[] = [];
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
    const source = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), buffer: null };
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
