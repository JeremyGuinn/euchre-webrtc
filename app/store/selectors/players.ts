import type { GameStore } from '../gameStore';

export const select = {
  currentPlayer: (state: GameStore) =>
    state.players.find(p => p.position === state.currentPlayerPosition),
  currentDealer: (state: GameStore) =>
    state.players.find(p => p.position === state.currentDealerPosition),
  currentMakerPlayer: (state: GameStore) =>
    state.players.find(p => p.position === state.maker?.playerPosition),
  currentFarmersHandPlayer: (state: GameStore) =>
    state.players.find(p => p.position === state.farmersHandPosition),
  myPlayer: (state: GameStore) => state.players.find(p => p.id === state.myPlayerId),
  myHand: (state: GameStore) => {
    const myPlayer = state.players.find(p => p.id === state.myPlayerId);
    return myPlayer ? state.hands[myPlayer.position] : [];
  },
};
