import { useCallback } from 'react';

import type { Card, GameState, Player } from '~/types/game';
import {
  canPlayCardWithOptions,
  getEffectiveSuit,
} from '../../../utils/gameLogic';

export function useGameUtils(gameState: GameState, myPlayerId: string) {
  const canPlay = useCallback(
    (card: Card): boolean => {
      const myHand = gameState.hands[myPlayerId] || [];

      let effectiveLeadSuit = undefined;
      if (gameState.currentTrick?.cards[0] && gameState.trump) {
        effectiveLeadSuit = getEffectiveSuit(
          gameState.currentTrick.cards[0].card,
          gameState.trump
        );
      }

      return canPlayCardWithOptions(
        card,
        myHand,
        effectiveLeadSuit,
        gameState.trump,
        gameState.options.allowReneging
      );
    },
    [
      gameState.hands,
      gameState.currentTrick,
      gameState.trump,
      gameState.options.allowReneging,
      myPlayerId,
    ]
  );

  const isMyTurn = useCallback((): boolean => {
    return gameState.currentPlayerId === myPlayerId;
  }, [gameState.currentPlayerId, myPlayerId]);

  const getMyPlayer = useCallback((): Player | undefined => {
    return gameState.players.find(p => p.id === myPlayerId);
  }, [gameState.players, myPlayerId]);

  const getMyHand = useCallback((): Card[] => {
    return gameState.hands[myPlayerId] || [];
  }, [gameState.hands, myPlayerId]);

  return {
    canPlay,
    isMyTurn,
    getMyPlayer,
    getMyHand,
  };
}
