import { createSelector } from 'reselect';
import type { Card } from '~/types/game';
import { canPlayCardWithOptions, getEffectiveSuit } from '~/utils/game/gameLogic';
import type { GameStore } from '../gameStore';

// Base selectors
const getPlayers = (state: GameStore) => state.players;
const getCurrentPlayerPosition = (state: GameStore) => state.currentPlayerPosition;
const getCurrentDealerPosition = (state: GameStore) => state.currentDealerPosition;
const getMaker = (state: GameStore) => state.maker;
const getFarmersHandPosition = (state: GameStore) => state.farmersHandPosition;
const getMyPlayerId = (state: GameStore) => state.myPlayerId;
const getHands = (state: GameStore) => state.hands;
const getCurrentTrick = (state: GameStore) => state.currentTrick;
const getTrump = (state: GameStore) => state.trump;
const getOptions = (state: GameStore) => state.options;

export const select = {
  currentPlayer: createSelector(
    [getPlayers, getCurrentPlayerPosition],
    (players, currentPlayerPosition) => players.find(p => p.position === currentPlayerPosition)
  ),

  currentDealer: createSelector(
    [getPlayers, getCurrentDealerPosition],
    (players, currentDealerPosition) => players.find(p => p.position === currentDealerPosition)
  ),

  currentMakerPlayer: createSelector([getPlayers, getMaker], (players, maker) =>
    players.find(p => p.position === maker?.playerPosition)
  ),

  currentFarmersHandPlayer: createSelector(
    [getPlayers, getFarmersHandPosition],
    (players, farmersHandPosition) => players.find(p => p.position === farmersHandPosition)
  ),

  myPlayer: createSelector([getPlayers, getMyPlayerId], (players, myPlayerId) =>
    players.find(p => p.id === myPlayerId)
  ),

  myHand: createSelector([getPlayers, getMyPlayerId, getHands], (players, myPlayerId, hands) => {
    const myPlayer = players.find(p => p.id === myPlayerId);
    return myPlayer ? hands[myPlayer.position] : [];
  }),

  isSittingOut: createSelector(
    [getMaker, getMyPlayerId, getPlayers],
    (maker, myPlayerId, players) => {
      if (maker?.alone && myPlayerId) {
        const myPlayer = players.find(p => p.id === myPlayerId);
        const makerPosition = maker.playerPosition;
        const makerPlayer = players.find(p => p.position === makerPosition);

        if (myPlayer && makerPlayer) {
          // If I'm on the same team as the maker but not the maker myself, I'm sitting out
          return myPlayer.teamId === makerPlayer.teamId && myPlayer.position !== makerPosition;
        }
      }
      return false;
    }
  ),

  canPlay: createSelector(
    [getPlayers, getMyPlayerId, getHands, getCurrentTrick, getTrump, getOptions],
    (players, myPlayerId, hands, currentTrick, trump, options) => {
      const myPlayer = players.find(p => p.id === myPlayerId);
      if (!myPlayer) return () => false;

      const myHand = hands[myPlayer.position] || [];
      let effectiveLeadSuit = undefined;
      if (currentTrick?.cards[0] && trump) {
        effectiveLeadSuit = getEffectiveSuit(currentTrick.cards[0].card, trump);
      }

      return (card: Card) =>
        canPlayCardWithOptions(card, myHand, effectiveLeadSuit, trump, options.allowReneging);
    }
  ),
};
