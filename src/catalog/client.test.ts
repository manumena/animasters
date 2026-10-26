import { describe, expect, it, vi } from 'vitest';
import { CatalogClient, type CatalogWorker } from './client';
import type { CatalogManifest, WorkerReply } from './types';

function worker() {
  const instance: CatalogWorker = {
    onmessage: null,
    onerror: null,
    postMessage: vi.fn(),
    terminate: vi.fn(),
  };
  return {
    instance,
    send: (data: WorkerReply) => instance.onmessage?.({ data } as MessageEvent<WorkerReply>),
  };
}

describe('catalog worker lifecycle', () => {
  it('loads once per app instance and correlates out-of-order query responses', async () => {
    const mock = worker();
    const factory = vi.fn(() => mock.instance);
    const client = new CatalogClient(factory);
    client.start();
    client.start();
    expect(factory).toHaveBeenCalledTimes(1);
    mock.send({ type: 'state', state: { phase: 'ready' } });
    const first = client.search('naruto');
    const second = client.search('one piece');
    const onePiece = [
      { id: 44, title: 'One Piece', matchedAlias: 'One Piece', detail: 'TV series · 1999' },
    ];
    mock.send({ type: 'results', requestId: 2, results: onePiece });
    mock.send({ type: 'results', requestId: 1, results: [] });
    expect(await first).toEqual([]);
    expect(await second).toEqual(onePiece);
  });

  it('retries safely, clears pending queries, ignores old workers and pins the loaded version', async () => {
    const first = worker();
    const second = worker();
    const client = new CatalogClient(
      vi.fn().mockReturnValueOnce(first.instance).mockReturnValueOnce(second.instance),
    );
    client.start();
    const version = 'a'.repeat(64);
    first.send({
      type: 'state',
      state: { phase: 'ready', manifest: { version } as CatalogManifest },
    });
    const pending = client.search('naruto');
    client.retry();
    expect(await pending).toEqual([]);
    expect(first.instance.terminate).toHaveBeenCalledOnce();
    expect(second.instance.postMessage).toHaveBeenCalledWith({ type: 'load', version });
    first.send({ type: 'state', state: { phase: 'ready' } });
    expect(client.getSnapshot().phase).toBe('downloading');
    second.send({ type: 'state', state: { phase: 'error', error: 'Offline' } });
    expect(client.getSnapshot().error).toBe('Offline');
    expect(await client.search('naruto')).toEqual([]);
  });
});
