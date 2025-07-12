import type { StateCreator } from 'zustand';
import type { GameOptions } from '~/types/game';
import type { GameStore } from '../gameStore';

export interface OptionsSlice {
  // State properties
  options: GameOptions;

  // Actions
  updateGameOptions: (options: GameOptions) => void;
}

export const createOptionsSlice: StateCreator<GameStore, [], [], OptionsSlice> = (set, get) => ({
  // State
  options: {
    teamSelection: 'predetermined',
    dealerSelection: 'random_cards',
    allowReneging: false,
    screwTheDealer: false,
    farmersHand: false,
  },

  updateGameOptions: (options: GameOptions) => {
    const { phase } = get();

    if (phase !== 'lobby') {
      return;
    }

    set({ options });
  },
});
