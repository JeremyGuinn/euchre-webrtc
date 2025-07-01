import { useEffect, useRef, useCallback } from "react";
import type { GameState } from "../../../types/game";
import { createPublicGameState } from "../../../utils/gameState";
import type { GameMessage } from "../../../types/messages";
import { createMessageId } from "../../../utils/protocol";
import { GameNetworkService } from "../services/networkService";
import { SessionStorageService } from "../services/sessionService";

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
    // Only broadcast if we're the host and the game state actually changed
    if (isHost && prevGameStateRef.current) {
      // Check if this is a meaningful change (not just a connection status update)
      const hasSignificantChange = 
        gameState.phase !== prevGameStateRef.current.phase ||
        gameState.players.length !== prevGameStateRef.current.players.length ||
        gameState.bids.length !== prevGameStateRef.current.bids.length ||
        gameState.completedTricks.length !== prevGameStateRef.current.completedTricks.length ||
        JSON.stringify(gameState.currentTrick) !== JSON.stringify(prevGameStateRef.current.currentTrick) ||
        gameState.currentPlayerId !== prevGameStateRef.current.currentPlayerId ||
        gameState.currentDealerId !== prevGameStateRef.current.currentDealerId ||
        gameState.trump !== prevGameStateRef.current.trump ||
        JSON.stringify(gameState.scores) !== JSON.stringify(prevGameStateRef.current.scores) ||
        JSON.stringify(gameState.handScores) !== JSON.stringify(prevGameStateRef.current.handScores) ||
        gameState.players.some((player: any, index: number) => {
          const prevPlayer = prevGameStateRef.current!.players[index];
          return !prevPlayer || 
            player.name !== prevPlayer.name ||
            player.position !== prevPlayer.position ||
            player.teamId !== prevPlayer.teamId;
        });

      if (hasSignificantChange) {
        broadcastGameState();
      }
    }
    
    // Update the previous state reference
    prevGameStateRef.current = { ...gameState };
  }, [gameState, isHost, connectionStatus, broadcastGameState]);

  return {
    broadcastGameState,
  };
}
