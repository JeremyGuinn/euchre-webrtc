import type { StateCreator } from 'zustand';
import type { TeamIndex } from '~/types/game';
import type { GameStore } from '../gameStore';

export interface TeamSlice {
  renameTeam: (teamId: TeamIndex, newName: string) => void;
}

export const createTeamSlice: StateCreator<GameStore, [], [], TeamSlice> = set => ({
  renameTeam: (teamId: TeamIndex, newName: string) => {
    set(state => ({
      teamNames: {
        ...state.teamNames,
        [`team${teamId}`]: newName,
      },
    }));
  },
});
