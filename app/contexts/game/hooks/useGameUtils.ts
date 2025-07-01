import { useCallback } from "react";
import type { Card, Player, GameState } from "../../../types/game";
import { canPlayCard } from "../../../utils/gameLogic";
import { uuidToGameCode } from "../../../utils/gameCode";

export function useGameUtils(gameState: GameState, myPlayerId: string) {
  const canPlay = useCallback(
    (card: Card): boolean => {
      const myHand = gameState.hands[myPlayerId] || [];
      const leadSuit = gameState.currentTrick?.cards[0]?.card.suit;
      return canPlayCard(card, myHand, leadSuit, gameState.trump);
    },
    [gameState.hands, gameState.currentTrick, gameState.trump, myPlayerId]
  );

  const isMyTurn = useCallback((): boolean => {
    return gameState.currentPlayerId === myPlayerId;
  }, [gameState.currentPlayerId, myPlayerId]);

  const getMyPlayer = useCallback((): Player | undefined => {
    return gameState.players.find((p) => p.id === myPlayerId);
  }, [gameState.players, myPlayerId]);

  const getMyHand = useCallback((): Card[] => {
    return gameState.hands[myPlayerId] || [];
  }, [gameState.hands, myPlayerId]);

  const getDisplayGameCode = useCallback((): string => {
    return gameState.id ? uuidToGameCode(gameState.id) : "";
  }, [gameState.id]);

  return {
    canPlay,
    isMyTurn,
    getMyPlayer,
    getMyHand,
    getDisplayGameCode,
  };
}
