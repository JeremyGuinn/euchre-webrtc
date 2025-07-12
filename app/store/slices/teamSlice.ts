import type { StateCreator } from 'zustand';
import type { TeamIndex } from '~/types/game';
import type { GameStore } from '../gameStore';

export interface TeamSlice {
  // State properties
  teamNames: {
    team0: string;
    team1: string;
  };
  scores: {
    team0: number;
    team1: number;
  };
  handScores: {
    team0: number;
    team1: number;
  };

  // Actions
  renameTeam: (teamId: TeamIndex, newName: string) => void;
}

export const createTeamSlice: StateCreator<GameStore, [], [], TeamSlice> = set => ({
  // State
  teamNames: {
    team0: 'Team 1',
    team1: 'Team 2',
  },
  scores: {
    team0: 0,
    team1: 0,
  },
  handScores: {
    team0: 0,
    team1: 0,
  },

  renameTeam: (teamId: TeamIndex, newName: string) => {
    set(state => ({
      teamNames: {
        ...state.teamNames,
        [`team${teamId}`]: newName,
      },
    }));
  },
});
