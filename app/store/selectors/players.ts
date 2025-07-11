import type { Card } from '~/types/game';
import { canPlayCardWithOptions, getEffectiveSuit } from '~/utils/game/gameLogic';
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
  isSittingOut: (state: GameStore) => {
    if (state.maker?.alone && state.myPlayerId) {
      const myPlayer = state.players.find(p => p.id === state.myPlayerId);
      const makerPosition = state.maker.playerPosition;
      const makerPlayer = state.players.find(p => p.position === makerPosition);

      if (myPlayer && makerPlayer) {
        // If I'm on the same team as the maker but not the maker myself, I'm sitting out
        return myPlayer.teamId === makerPlayer.teamId && myPlayer.position !== makerPosition;
      }
    }
    return false;
  },
  canPlay: (state: GameStore) => {
    const myPlayer = state.players.find(p => p.id === state.myPlayerId);
    if (!myPlayer) return () => false;

    const myHand = state.hands[myPlayer.position] || [];
    let effectiveLeadSuit = undefined;
    if (state.currentTrick?.cards[0] && state.trump) {
      effectiveLeadSuit = getEffectiveSuit(state.currentTrick.cards[0].card, state.trump);
    }

    return (card: Card) =>
      canPlayCardWithOptions(
        card,
        myHand,
        effectiveLeadSuit,
        state.trump,
        state.options.allowReneging
      );
  },
};
