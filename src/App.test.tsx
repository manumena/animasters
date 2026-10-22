import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useGameStore } from './stores/useGameStore';
import { Song } from './types';

const songs: Song[] = [
  { id: 1, name: 'Test opening', anime: 'Test anime', type: 'opening', number: 1, path: 'test/first.mp3' },
  { id: 2, name: 'Second opening', anime: 'Second anime', type: 'opening', number: 1, path: 'test/second.mp3' },
];

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true);
});

describe('existing game flows', () => {
  it('requires a name for every player and supports adding and removing players', async () => {
    const user = userEvent.setup();
    renderApp();
    const start = screen.getByRole('button', { name: 'Start' });
    expect(start).toBeDisabled();
    await user.type(screen.getByPlaceholderText('Enter player name...'), 'Manu');
    expect(start).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Add player' }));
    expect(start).toBeDisabled();
    await user.type(screen.getAllByPlaceholderText('Enter player name...')[1], 'Alex');
    expect(start).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Remove player' }));
    expect(screen.getAllByPlaceholderText('Enter player name...')).toHaveLength(1);
    expect(screen.getByPlaceholderText('Enter player name...')).toHaveValue('Alex');
    expect(start).toBeEnabled();
  });

  it('keeps settings when returning to the main screen', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const amount = screen.getByRole('textbox');
    await user.clear(amount);
    await user.type(amount, '20');
    await user.click(screen.getAllByRole('checkbox')[1]);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByRole('heading', { name: 'AniMasters' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('textbox')).toHaveValue('20');
    expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
  });

  it('loads a match, reveals answers, navigates songs, keeps manual scores, and loads a new round', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ match: songs }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { container } = renderApp();
    await user.type(screen.getByPlaceholderText('Enter player name...'), 'Manu');
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await screen.findByRole('button', { name: 'Reveal' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('amount')).toBe('40');
    expect(container.querySelector('audio')).toHaveAttribute('src', expect.stringContaining(songs[0].path));
    await user.click(screen.getByRole('button', { name: 'Reveal' }));
    expect(screen.getByRole('button', { name: 'Test anime - Test opening' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next song' }));
    expect(screen.getByText('2 / 2')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reveal' })).toBeVisible();
    expect(container.querySelector('audio')).toHaveAttribute('src', expect.stringContaining(songs[1].path));
    await user.click(screen.getByRole('button', { name: 'Previous song' }));
    expect(screen.getByRole('button', { name: 'Test anime - Test opening' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Add point for Manu' }));
    const score = screen.getByText('Manu').parentElement!;
    expect(within(score).getByText('1')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Remove point for Manu' }));
    expect(within(score).getByText('0')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'New Round' }));
    expect(await screen.findByRole('button', { name: 'Reveal' })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText('1 / 2')).toBeVisible();
  });

  it('renders the existing Pochita route with its image and Supabase media', () => {
    const { container } = renderApp('/pochita');
    expect(screen.getByText('Pochita appreciation page')).toBeVisible();
    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('pocha.png'));
    expect(container.querySelector('audio')).toHaveAttribute('src', expect.stringContaining('supabase.co/storage/'));
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute('target', '_blank');
  });
});
