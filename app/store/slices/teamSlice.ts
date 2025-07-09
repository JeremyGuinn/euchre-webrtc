import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';

export interface TeamSlice {
  renameTeam: (teamId: 0 | 1, newName: string) => void;
}

export const createTeamSlice: StateCreator<GameStore, [], [], TeamSlice> = set => ({
  renameTeam: (teamId: 0 | 1, newName: string) => {
    set(state => ({
      teamNames: {
        ...state.teamNames,
        [`team${teamId}`]: newName,
      },
    }));
  },
});
