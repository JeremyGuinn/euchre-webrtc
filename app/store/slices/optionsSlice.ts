import type { StateCreator } from 'zustand';
import type { GameOptions } from '~/types/game';
import type { GameStore } from '../gameStore';

export interface OptionsSlice {
  updateGameOptions: (options: GameOptions) => void;
}

export const createOptionsSlice: StateCreator<GameStore, [], [], OptionsSlice> = (set, get) => ({
  updateGameOptions: (options: GameOptions) => {
    const { phase } = get();

    if (phase !== 'lobby') {
      return;
    }

    set({ options });
  },
});
