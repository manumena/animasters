import { CatalogIndex } from './search';
import { loadCatalog } from './load';
import type { WorkerReply, WorkerRequest } from './types';

const reply = (message: WorkerReply) => postMessage(message);
let index: CatalogIndex | undefined;
let loading = false;

onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === 'load') {
    if (loading || index) return;
    loading = true;
    try {
      const { data, manifest } = await loadCatalog(state => reply({ type: 'state', state }), request.version);
      index = new CatalogIndex(data);
      reply({ type: 'state', state: { phase: 'ready', manifest } });
    } catch {
      reply({ type: 'state', state: { phase: 'error', error: 'The anime catalog could not be loaded. Check your connection and try again.' } });
    } finally { loading = false; }
  } else if (request.type === 'search' && index) {
    reply({ type: 'results', requestId: request.requestId, results: index.search(request.query) });
  }
};
