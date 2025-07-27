import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { fetchSongs } from '../api/fetch';
import { Match, Song } from '../types';

export enum ViewState { MAIN, PLAYING, RESULTS, SETTINGS }

export interface Settings {
  songsPerRound: number;
}

interface GameState {
  // UI screen state
  view: ViewState;

  // Game data
  players: string[];
  songs: Song[];
  
  // Game settings
  settings: Settings;

  // Actions
  startGame: (playerNames: string[]) => void;
  openSettings: () => void;
  saveSettings: (newSettings: Settings) => void;
}

const DEFAULT_SONGS_PER_ROUND = 40;

export const useGameStore = create<GameState>()(
  devtools((set, get) => ({
    view: ViewState.MAIN,
    players: [],
    songs: [],
    settings: {
      songsPerRound: DEFAULT_SONGS_PER_ROUND,
    },

    startGame: (playerNames) => {
      set({ players: playerNames });
      // Fetch songs async
      fetchSongs((data: Match) => {
        set({ songs: data.match, view: ViewState.PLAYING });
      }, get().settings.songsPerRound);
    },

    openSettings: () => set({ view: ViewState.SETTINGS }),

  saveSettings: (newSettings) => {
      set({ settings: newSettings });
      set({ view: ViewState.MAIN });
    }
  }))
);