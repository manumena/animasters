import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AnimeAutocomplete from './AnimeAutocomplete';
import { CatalogClient, type CatalogWorker } from '../catalog/client';
import type { AnimeOption, WorkerReply } from '../catalog/types';

const naruto = { id: 42, title: 'Naruto', matchedAlias: 'Naruto', detail: 'TV series · 2002' };
function setup(onSubmit?: (anime: AnimeOption) => void) {
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
        <AnimeAutocomplete client={client} value={value} onChange={setValue} onSubmit={onSubmit} />
        <output aria-label="Selected anime ID">{value?.id ?? 'none'}</output>
      </>
    );
  }
  const { unmount } = render(<Harness />);
  return { client, send, unmount };
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

it('focuses each round when enabled and ready without stealing focus on updates', async () => {
  const user = userEvent.setup();
  const { client, send, unmount } = setup();
  unmount();
  const renderRound = (roundId: string, disabled: boolean) => (
    <>
      <AnimeAutocomplete
        key={roundId}
        autoFocus
        client={client}
        value={null}
        onChange={vi.fn()}
        disabled={disabled}
      />
      <button>Other control</button>
    </>
  );
  const { rerender } = render(renderRound('first', true));
  const roundInput = screen.getByRole('combobox');

  expect(roundInput).not.toHaveFocus();
  rerender(renderRound('first', false));
  expect(roundInput).not.toHaveFocus();
  act(() => send({ type: 'state', state: { phase: 'ready' } }));
  expect(roundInput).toHaveFocus();

  await user.click(screen.getByRole('button', { name: 'Other control' }));
  rerender(renderRound('first', false));
  expect(roundInput).not.toHaveFocus();

  rerender(renderRound('second', true));
  const nextRoundInput = screen.getByRole('combobox');
  expect(nextRoundInput).not.toHaveFocus();
  rerender(renderRound('second', false));
  expect(nextRoundInput).toHaveFocus();
});

it('accepts typing immediately when the first song mounts with a ready catalog', async () => {
  const user = userEvent.setup();
  const { client, send, unmount } = setup();
  act(() => send({ type: 'state', state: { phase: 'ready' } }));
  unmount();

  render(
    <AnimeAutocomplete
      autoFocus
      client={client}
      value={null}
      onChange={vi.fn()}
    />,
  );

  expect(screen.getByRole('combobox')).toHaveFocus();
  await user.keyboard('naru');
  expect(screen.getByRole('combobox')).toHaveValue('naru');
  expect(await screen.findByRole('option', { name: /Naruto/ })).toBeVisible();
});

it('shows the matched alternate name rather than repeating the canonical title', async () => {
  const user = userEvent.setup();
  const { send } = setup();
  act(() => send({ type: 'state', state: { phase: 'ready' } }));
  await user.type(screen.getByRole('combobox'), 'alternate');
  const option = await screen.findByRole('option', { name: /Alternate name/ });
  expect(option.textContent?.match(/Naruto/g)).toHaveLength(1);
});


it('uses one Enter to select and a separate Enter to submit a committed answer', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const { send } = setup(onSubmit);
  act(() => send({ type: 'state', state: { phase: 'ready' } }));
  const input = screen.getByRole('combobox');
  await user.type(input, 'naru');
  await screen.findByRole('option');
  await user.keyboard('{ArrowDown}{Enter}');
  expect(screen.getByLabelText('Selected anime ID')).toHaveTextContent('42');
  expect(onSubmit).not.toHaveBeenCalled();
  for (const options of [
    { repeat: true }, { isComposing: true }, { keyCode: 229 },
    { ctrlKey: true }, { altKey: true }, { metaKey: true }, { shiftKey: true },
  ]) {
    fireEvent.keyDown(input, { key: 'Enter', ...options });
  }
  expect(onSubmit).not.toHaveBeenCalled();
  await user.keyboard('{Enter}');
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith(naruto);
  await user.type(input, 'x');
  await user.keyboard('{Enter}');
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

it('keeps Space available when editing a selected anime title', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  const { send } = setup(onSubmit);
  act(() => send({ type: 'state', state: { phase: 'ready' } }));
  const input = screen.getByRole('combobox');
  await user.type(input, 'naru');
  await screen.findByRole('option');
  await user.keyboard('{ArrowDown}{Enter}');
  await user.keyboard(' ');
  expect(input).toHaveValue('Naruto ');
  expect(screen.getByLabelText('Selected anime ID')).toHaveTextContent('none');
  expect(onSubmit).not.toHaveBeenCalled();
});
