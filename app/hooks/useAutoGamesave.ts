import { useEffect, useRef } from 'react';
import { GameStatePersistenceService } from '~/services/gameStatePersistenceService';
import { gameStore } from '~/store/gameStore';

/**
 * Hook that automatically saves game state to localStorage for hosts
 * This enables host reconnection with full game state restoration
 */
export function useAutoGamesave(connectionStatus: string) {
  const lastSavedRef = useRef<string>('');

  const isHost = gameStore.use.isHost();
  const id = gameStore.use.id();
  const phase = gameStore.use.phase();
  const players = gameStore.use.players();
  const currentPlayerPosition = gameStore.use.currentPlayerPosition();
  const currentDealerPosition = gameStore.use.currentDealerPosition();
  const hands = gameStore.use.hands();
  const bids = gameStore.use.bids();
  const completedTricks = gameStore.use.completedTricks();
  const scores = gameStore.use.scores();

  const gameState = gameStore();

  useEffect(() => {
    const isConnected = () => connectionStatus === 'connected';

    // Only save for hosts when connected and game has an ID
    if (!isHost || !isConnected() || !id) {
      return;
    }

    // Avoid unnecessary saves by comparing serialized state
    const currentStateString = JSON.stringify({
      // Only include the essential parts for comparison to avoid over-saving
      phase: phase,
      players: players.map(p => ({
        id: p.id,
        isConnected: p.isConnected,
      })),
      currentPlayerPosition: currentPlayerPosition,
      currentDealerPosition: currentDealerPosition,
      hands: Object.keys(hands),
      bids: bids.length,
      completedTricks: completedTricks.length,
      scores: scores,
    });

    if (currentStateString !== lastSavedRef.current) {
      lastSavedRef.current = currentStateString;

      // Save the full game state
      GameStatePersistenceService.saveGameState(id, gameState);
    }

    return () => {
      // Clean up old game states when component unmounts
      GameStatePersistenceService.cleanup();
    };
  }, [
    isHost,
    id,
    phase,
    players,
    currentPlayerPosition,
    currentDealerPosition,
    hands,
    bids.length,
    completedTricks.length,
    scores,
    gameState,
    connectionStatus,
  ]);
}
