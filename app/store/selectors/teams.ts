import { createSelector } from 'reselect';
import type { GameState, TeamIndex } from '~/types/game';

const selectCompletedTricks = (state: GameState) => state.completedTricks;
const selectPlayers = (state: GameState) => state.players;

export const select = {
  teamScore: (teamId: TeamIndex) =>
    createSelector([selectCompletedTricks, selectPlayers], (completedTricks, players) => {
      return completedTricks.filter(trick => {
        const winner = players.find(p => p.position === trick.winnerPosition);
        return winner?.teamId === teamId;
      }).length;
    }),
};
