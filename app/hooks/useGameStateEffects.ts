import { useCallback, useEffect, useRef } from 'react';

import { createMessageId } from '~/network/protocol';
import { GameNetworkService } from '~/services/networkService';
import type { GameStore } from '~/store/gameStore';
import { useGameStore } from '~/store/gameStore';
import type { Player } from '~/types/game';

export function useGameStateEffects(
  gameStore: GameStore,
  myPlayerId: string,
  isHost: boolean,
  networkService: GameNetworkService
) {
  const stateRef = useRef({
    gameStore,
    myPlayerId,
    networkService,
  });

  // Update the ref when props change
  useEffect(() => {
    stateRef.current = {
      gameStore,
      myPlayerId,
      networkService,
    };
  }, [gameStore, myPlayerId, networkService]);

  const broadcastGameState = useCallback(() => {
    const {
      gameStore: currentGameStore,
      myPlayerId: currentMyPlayerId,
      networkService: currentNetworkService,
    } = stateRef.current;

    currentGameStore.players.forEach((player: Player) => {
      if (player.id !== currentMyPlayerId) {
        const personalizedState = currentGameStore.createPublicGameState(player.id);

        currentNetworkService.sendMessage(
          {
            type: 'GAME_STATE_UPDATE',
            timestamp: Date.now(),
            messageId: createMessageId(),
            payload: { gameState: personalizedState },
          },
          player.id
        );
      }
    });
  }, []);

  useEffect(() => {
    if (!isHost) return;

    const unsubscribe = useGameStore.subscribe(
      state => ({
        players: state.players,
        phase: state.phase,
        currentDealerPosition: state.currentDealerPosition,
        hands: state.hands,
        bids: state.bids,
        completedTricks: state.completedTricks,
        scores: state.scores,
        handScores: state.handScores,
      }),
      () => broadcastGameState()
    );

    return unsubscribe;
  }, [isHost, broadcastGameState]);

  return {
    broadcastGameState,
  };
}
