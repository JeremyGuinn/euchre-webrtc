import { useEffect, useRef, useCallback } from "react";
import type { GameState } from "../../../types/game";
import { createPublicGameState } from "../../../utils/gameState";
import type { GameMessage } from "../../../types/messages";
import { createMessageId } from "../../../utils/protocol";
import { GameNetworkService } from "../services/networkService";

export function useGameStateEffects(
  gameState: GameState,
  myPlayerId: string,
  isHost: boolean,
  connectionStatus: "disconnected" | "connecting" | "connected" | "error",
  networkService: GameNetworkService
) {
  const prevGameStateRef = useRef<GameState | undefined>(undefined);

  // Define broadcastGameState function
  const broadcastGameState = useCallback(() => {
    // Send personalized state to each player
    gameState.players.forEach((player: any) => {
      if (player.id !== myPlayerId) {
        const personalizedState = createPublicGameState(gameState, player.id);
        const message: GameMessage = {
          type: "GAME_STATE_UPDATE",
          timestamp: Date.now(),
          messageId: createMessageId(),
          payload: { gameState: personalizedState },
        };

        networkService.sendMessage(message, player.id);
      }
    });
  }, [gameState, myPlayerId, networkService]);

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
