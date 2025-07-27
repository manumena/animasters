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
  setView: (v: ViewState) => void;

  // Game data
  players: string[];
  songs: Song[];
  songsPerRound: number;
  setSongsPerRound: (n: number) => void;

  // Actions
  startGame: (playerNames: string[]) => void;
  backFromSettings: (newSettings: Settings) => void;
}

const DEFAULT_SONGS_PER_ROUND = 40;

export const useGameStore = create<GameState>()(
  devtools((set, get) => ({
    view: ViewState.MAIN,
    players: [],
    songs: [],
    songsPerRound: DEFAULT_SONGS_PER_ROUND,

    setView: (v) => set({ view: v }),

    setSongsPerRound: (n) => set({ songsPerRound: n }),

    startGame: (playerNames) => {
      set({ players: playerNames });
      // Fetch songs async
      fetchSongs((data: Match) => {
        set({ songs: data.match, view: ViewState.PLAYING });
      }, get().songsPerRound);
    },

    backFromSettings: (newSettings) => {
      if (newSettings.songsPerRound !== get().songsPerRound) {
        set({ songsPerRound: newSettings.songsPerRound });
      }
      set({ view: ViewState.MAIN });
    }
  }))
);