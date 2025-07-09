import type { StateCreator } from 'zustand';
import type { Card } from '~/types/game';
import { performFarmersHandSwap } from '~/utils/game/gameLogic';
import { getNextPlayer } from '~/utils/game/playerUtils';
import type { GameStore } from '../gameStore';

export interface FarmersHandSlice {
  farmersHandDetected: (playerId: string) => void;
  farmersHandSwap: (playerId: string, cardsToSwap: Card[]) => void;
  farmersHandDeclined: (playerId: string) => void;
}

export const createFarmersHandSlice: StateCreator<GameStore, [], [], FarmersHandSlice> = (
  set,
  get
) => ({
  farmersHandDetected: (playerId: string) => {
    set({
      phase: 'farmers_hand_swap',
      farmersHandPlayer: playerId,
      currentPlayerId: playerId,
    });
  },

  farmersHandSwap: (playerId: string, cardsToSwap: Card[]) => {
    const { kitty, farmersHandPlayer, hands, deck, currentDealerId, players } = get();

    if (!kitty || !farmersHandPlayer || farmersHandPlayer !== playerId) {
      return;
    }

    const playerHand = hands[playerId];
    if (!playerHand) {
      return;
    }

    const { newHand, newKitty, newRemainingDeck } = performFarmersHandSwap(
      playerHand,
      cardsToSwap,
      kitty,
      deck
    );

    set({
      hands: {
        ...hands,
        [playerId]: newHand,
      },
      kitty: newKitty,
      deck: newRemainingDeck,
      phase: 'bidding_round1',
      currentPlayerId: getNextPlayer(currentDealerId, players),
      farmersHandPlayer: undefined,
    });
  },

  farmersHandDeclined: (playerId: string) => {
    const { farmersHandPlayer, currentDealerId, players } = get();

    if (!farmersHandPlayer || farmersHandPlayer !== playerId) {
      return;
    }

    set({
      phase: 'bidding_round1',
      currentPlayerId: getNextPlayer(currentDealerId, players),
      farmersHandPlayer: undefined,
    });
  },
});
