import { useEffect, useRef } from 'react';
import { GameStatePersistenceService } from '~/services/gameStatePersistenceService';
import { useGameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';

/**
 * Hook that automatically saves game state to localStorage for hosts
 * This enables host reconnection with full game state restoration
 */
export function useGameStatePersistence(connectionStatus: string) {
  const lastSavedRef = useRef<string>('');

  const gameStore = useGameStore();
  const {
    id,
    phase,
    players,
    currentPlayerPosition,
    currentDealerPosition,
    bids,
    completedTricks,
    scores,
    hands,
  } = gameStore;
  const isHost = useGameStore(state => select.myPlayer(state)?.isHost);

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
      GameStatePersistenceService.saveGameState(id, gameStore);
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
    gameStore,
    connectionStatus,
  ]);
}
