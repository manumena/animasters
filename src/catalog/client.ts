import type { AnimeOption, CatalogState, WorkerReply, WorkerRequest } from './types';

// A small interface keeps this bridge testable without creating a real worker.
export interface CatalogWorker {
  onmessage: ((event: MessageEvent<WorkerReply>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: WorkerRequest): void;
  terminate(): void;
}

/** Main-thread bridge: React uses Promises and subscriptions instead of raw messages. */
export class CatalogClient {
  private worker?: CatalogWorker;
  private state: CatalogState = { phase: 'idle' };
  private listeners = new Set<() => void>();

  // Each search owns a resolver. A reply can arrive after a newer query was sent.
  private requestId = 0;
  private pending = new Map<number, (results: AnimeOption[]) => void>();

  constructor(
    private createWorker: () => CatalogWorker,
    private version?: string,
  ) {}

  // React subscribes through useSyncExternalStore. Snapshots retain their identity
  // until a worker message changes the state, avoiding unnecessary renders.
  getSnapshot = (): CatalogState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private update(state: CatalogState) {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }

  start = () => {
    if (this.worker) return;
    this.update({ phase: 'downloading' });

    try {
      const worker = this.createWorker();
      this.worker = worker;
      worker.onmessage = ({ data }) => {
        // A terminated worker may still have a queued reply after a retry.
        if (this.worker === worker) this.handleReply(data);
      };
      worker.onerror = () => {
        if (this.worker !== worker) return;
        this.clearPending();
        this.update({ phase: 'error', error: 'Anime search stopped. Please try again.' });
      };
      worker.postMessage({ type: 'load', version: this.version });
    } catch {
      this.update({
        phase: 'error',
        error: 'This browser could not start anime search. Please try again in an updated browser.',
      });
    }
  };

  private handleReply(message: WorkerReply) {
    if (message.type === 'state') {
      if (message.state.phase === 'error') this.clearPending();

      // Once loaded, keep this version across retries rather than changing the
      // available answers during the same page/game session.
      if (message.state.phase === 'ready') this.version = message.state.manifest?.version;
      this.update(message.state);
      return;
    }

    this.pending.get(message.requestId)?.(message.results);
    this.pending.delete(message.requestId);
  }

  search(query: string): Promise<AnimeOption[]> {
    if (this.state.phase !== 'ready' || !this.worker) return Promise.resolve([]);

    const requestId = ++this.requestId;
    return new Promise((resolve) => {
      this.pending.set(requestId, resolve);
      this.worker!.postMessage({ type: 'search', requestId, query });
    });
  }

  // Retry replaces the worker and releases its old index. Ordinary navigation
  // keeps it alive so returning to the catalog does not rebuild the index.
  retry = () => {
    this.dispose();
    this.start();
  };

  private clearPending() {
    this.pending.forEach((resolve) => resolve([]));
    this.pending.clear();
  }

  dispose() {
    this.worker?.terminate();
    this.worker = undefined;
    this.clearPending();
    this.update({ phase: 'idle' });
  }
}

// Constructed lazily by start(); importing this module does not download a catalog.
export const catalogClient = new CatalogClient(
  () => new Worker(new URL('./catalog.worker.ts', import.meta.url), { type: 'module' }),
);
