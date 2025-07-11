import { useCallback } from 'react';

import type { Card, GameState, Player } from '~/types/game';
import { canPlayCardWithOptions, getEffectiveSuit } from '~/utils/game/gameLogic';
import { getPositionFromPlayerId } from '~/utils/game/playerUtils';

export function useGameUtils(gameState: GameState, myPlayerId: string | undefined) {
  const myPosition = getPositionFromPlayerId(myPlayerId, gameState.players);

  const canPlay = useCallback(
    (card: Card): boolean => {
      if (myPosition === undefined) return false;

      const myHand = gameState.hands[myPosition] || [];

      let effectiveLeadSuit = undefined;
      if (gameState.currentTrick?.cards[0] && gameState.trump) {
        effectiveLeadSuit = getEffectiveSuit(gameState.currentTrick.cards[0].card, gameState.trump);
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
      myPosition,
    ]
  );

  const isMyTurn = useCallback((): boolean => {
    return gameState.currentPlayerPosition === myPosition;
  }, [gameState.currentPlayerPosition, myPosition]);

  const isSittingOut = useCallback((): boolean => {
    // Check if I'm the teammate of someone going alone
    if (gameState.maker?.alone && myPosition !== undefined) {
      const myPlayer = gameState.players.find(p => p.id === myPlayerId);
      const makerPosition = gameState.maker.playerPosition;
      const makerPlayer = gameState.players.find(p => p.position === makerPosition);

      if (myPlayer && makerPlayer) {
        // If I'm on the same team as the maker but not the maker myself, I'm sitting out
        return myPlayer.teamId === makerPlayer.teamId && myPosition !== makerPosition;
      }
    }
    return false;
  }, [gameState.maker, gameState.players, myPlayerId, myPosition]);

  const getMyPlayer = useCallback((): Player | undefined => {
    return gameState.players.find(p => p.id === myPlayerId);
  }, [gameState.players, myPlayerId]);

  const getMyHand = useCallback((): Card[] => {
    if (myPosition === undefined) return [];
    return gameState.hands[myPosition] || [];
  }, [gameState.hands, myPosition]);

  return {
    canPlay,
    isMyTurn,
    isSittingOut,
    getMyPlayer,
    getMyHand,
  };
}
