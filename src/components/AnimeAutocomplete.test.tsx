import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AnimeAutocomplete from './AnimeAutocomplete';
import { CatalogClient, type CatalogWorker } from '../catalog/client';
import type { AnimeOption, WorkerReply } from '../catalog/types';

const naruto = { id: 42, title: 'Naruto', matchedAlias: 'Naruto', detail: 'TV series · 2002' };
function setup() {
  const worker: CatalogWorker = {
    onmessage: null,
    onerror: null,
    terminate: vi.fn(),
    postMessage: vi.fn((message) => {
      if (message.type === 'search')
        queueMicrotask(() =>
          send({
            type: 'results',
            requestId: message.requestId,
            results:
              message.query === 'naru'
                ? [naruto]
                : message.query === 'alternate'
                  ? [{ ...naruto, matchedAlias: 'Alternate name' }]
                  : [],
          }),
        );
    }),
  };
  const send = (data: WorkerReply) => worker.onmessage?.({ data } as MessageEvent<WorkerReply>);
  const client = new CatalogClient(() => worker);
  function Harness() {
    const [value, setValue] = useState<AnimeOption | null>(null);
    return (
      <>
        <AnimeAutocomplete client={client} value={value} onChange={setValue} />
        <output aria-label="Selected anime ID">{value?.id ?? 'none'}</output>
      </>
    );
  }
  render(<Harness />);
  return { client, send };
}

it('selects a real ID using the keyboard and clears it when free text is edited', async () => {
  const user = userEvent.setup();
  const { send } = setup();
  expect(screen.getByRole('combobox')).toBeDisabled();
  act(() => send({ type: 'state', state: { phase: 'ready' } }));
  await user.type(screen.getByRole('combobox'), 'naru');
  await screen.findByRole('option', { name: /Naruto/ });
  await user.keyboard('{ArrowDown}{Enter}');
  expect(screen.getByLabelText('Selected anime ID')).toHaveTextContent('42');
  await user.type(screen.getByRole('combobox'), 'x');
  expect(screen.getByLabelText('Selected anime ID')).toHaveTextContent('none');
  expect(await screen.findByText('No anime found. Try another title or spelling.')).toBeVisible();
});

it('provides a retry path after download failure', async () => {
  const user = userEvent.setup();
  const { send } = setup();
  act(() => send({ type: 'state', state: { phase: 'error', error: 'Download failed' } }));
  expect(screen.getByRole('alert')).toHaveTextContent('Download failed');
  await user.click(screen.getByRole('button', { name: 'Retry' }));
  expect(screen.getByText('Loading anime catalog…')).toBeVisible();
  act(() => send({ type: 'state', state: { phase: 'ready' } }));
  expect(screen.getByRole('combobox')).toBeEnabled();
});

it('shows the matched alternate name rather than repeating the canonical title', async () => {
  const user = userEvent.setup();
  const { send } = setup();
  act(() => send({ type: 'state', state: { phase: 'ready' } }));
  await user.type(screen.getByRole('combobox'), 'alternate');
  const option = await screen.findByRole('option', { name: /Alternate name/ });
  expect(option.textContent?.match(/Naruto/g)).toHaveLength(1);
});
