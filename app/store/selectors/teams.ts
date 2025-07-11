import type { GameState, TeamIndex } from '~/types/game';

export const select = {
  teamScore: (teamId: TeamIndex) => (state: GameState) => {
    return state.completedTricks.filter(trick => {
      const winner = state.players.find(p => p.position === trick.winnerPosition);
      return winner?.teamId === teamId;
    }).length;
  },
};
