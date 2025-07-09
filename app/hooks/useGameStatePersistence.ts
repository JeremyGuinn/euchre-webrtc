import { useEffect, useMemo, useRef } from 'react';
import { GameStatePersistenceService } from '~/services/gameStatePersistenceService';
import type { GameState } from '~/types/game';

/**
 * Hook that automatically saves game state to localStorage for hosts
 * This enables host reconnection with full game state restoration
 */
export function useGameStatePersistence(
  gameState: GameState,
  isHost: boolean,
  connectionStatus: string
) {
  const lastSavedRef = useRef<string>('');

  const isConnected = useMemo(() => {
    return connectionStatus === 'connected' || connectionStatus === 'reconnecting';
  }, [connectionStatus]);

  useEffect(() => {
    // Only save for hosts when connected and game has an ID
    if (!isHost || !isConnected || !gameState.id) {
      return;
    }

    // Avoid unnecessary saves by comparing serialized state
    const currentStateString = JSON.stringify({
      // Only include the essential parts for comparison to avoid over-saving
      phase: gameState.phase,
      players: gameState.players.map(p => ({
        id: p.id,
        isConnected: p.isConnected,
      })),
      currentPlayerId: gameState.currentPlayerId,
      currentDealerId: gameState.currentDealerId,
      hands: Object.keys(gameState.hands),
      bids: gameState.bids.length,
      completedTricks: gameState.completedTricks.length,
      scores: gameState.scores,
    });

    if (currentStateString !== lastSavedRef.current) {
      lastSavedRef.current = currentStateString;

      // Save the full game state
      GameStatePersistenceService.saveGameState(gameState.id, gameState);
    }
  }, [gameState, isHost, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up old game states when component unmounts
      GameStatePersistenceService.cleanup();
    };
  }, []);
}
