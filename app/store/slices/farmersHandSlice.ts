import type { StateCreator } from 'zustand';
import type { Card, PositionIndex } from '~/types/game';
import { performFarmersHandSwap } from '~/utils/game/gameLogic';
import { getNextPlayerPosition } from '~/utils/game/playerUtils';
import type { GameStore } from '../gameStore';

export interface FarmersHandSlice {
  farmersHandDetected: (playerPosition: PositionIndex) => void;
  farmersHandSwap: (playerPosition: PositionIndex, cardsToSwap: Card[]) => void;
  farmersHandDeclined: (playerPosition: PositionIndex) => void;
}

export const createFarmersHandSlice: StateCreator<GameStore, [], [], FarmersHandSlice> = (
  set,
  get
) => ({
  farmersHandDetected: (playerPosition: PositionIndex) => {
    set({
      phase: 'farmers_hand_swap',
      farmersHandPosition: playerPosition,
      currentPlayerPosition: playerPosition,
    });
  },

  farmersHandSwap: (playerPosition: PositionIndex, cardsToSwap: Card[]) => {
    const { kitty, farmersHandPosition, hands, deck, currentDealerPosition } = get();

    if (!kitty || farmersHandPosition === undefined || farmersHandPosition !== playerPosition) {
      return;
    }

    const playerHand = hands[playerPosition];
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
        [playerPosition]: newHand,
      },
      kitty: newKitty,
      deck: newRemainingDeck,
      phase: 'bidding_round1',
      currentPlayerPosition: getNextPlayerPosition(currentDealerPosition),
      farmersHandPosition: undefined,
    });
  },

  farmersHandDeclined: (playerPosition: PositionIndex) => {
    const { farmersHandPosition, currentDealerPosition } = get();

    if (farmersHandPosition === undefined || farmersHandPosition !== playerPosition) {
      return;
    }

    set({
      phase: 'bidding_round1',
      currentPlayerPosition: getNextPlayerPosition(currentDealerPosition),
      farmersHandPosition: undefined,
    });
  },
});
