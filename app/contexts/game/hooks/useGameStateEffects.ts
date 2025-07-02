import { useEffect, useRef, useCallback } from "react";
import type { GameState } from "../../../types/game";
import { createPublicGameState } from "../../../utils/gameState";
import { createMessageId } from "../../../utils/protocol";
import { GameNetworkService } from "../services/networkService";

export function useGameStateEffects(
  gameState: GameState,
  myPlayerId: string,
  isHost: boolean,
  networkService: GameNetworkService
) {
  const prevGameStateRef = useRef<GameState | undefined>(undefined);

  // Use refs to avoid recreating broadcastGameState on every render
  const stateRef = useRef({
    gameState,
    myPlayerId,
    networkService,
  });

  // Update refs without triggering re-renders
  stateRef.current = {
    gameState,
    myPlayerId,
    networkService,
  };

  // Create stable broadcastGameState function
  const broadcastGameState = useCallback(() => {
    const { gameState: currentGameState, myPlayerId: currentMyPlayerId, networkService: currentNetworkService } = stateRef.current;

    // Send personalized state to each player
    currentGameState.players.forEach((player: any) => {
      if (player.id !== currentMyPlayerId) {
        const personalizedState = createPublicGameState(currentGameState, player.id);

        currentNetworkService.sendMessage({
          type: "GAME_STATE_UPDATE",
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { gameState: personalizedState },
        }, player.id);
      }
    });
  }, []); // Empty dependency array - function is stable

  // Auto-broadcast game state changes when host
  useEffect(() => {
    if (isHost && prevGameStateRef.current) {
      broadcastGameState();
    }

    prevGameStateRef.current = { ...gameState };
  }, [gameState, isHost, broadcastGameState]);

  return {
    broadcastGameState,
  };
}
