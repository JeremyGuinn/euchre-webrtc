import { useEffect } from 'react';

import { createMessageId } from '~/network/protocol';
import { useGameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import type { Player } from '~/types/game';
import type { NetworkService } from '~/types/networkService';

export function useGameStateEffects(networkService: NetworkService) {
  const { createPublicGameState } = useGameStore();
  const players = useGameStore(state => state.players);
  const myPlayerId = useGameStore(state => state.myPlayerId);
  const id = useGameStore(state => state.id);
  const isHost = useGameStore(state => select.myPlayer(state)?.isHost);
  const updateGameOptions = useGameStore(state => state.updateGameOptions);

  // Initialize the game state with default values
  useEffect(() => {
    if (!id) {
      updateGameOptions({
        allowReneging: false,
        teamSelection: 'predetermined',
        dealerSelection: 'first_black_jack',
        screwTheDealer: false,
        farmersHand: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on gameState.id to avoid infinite loops

  useEffect(() => {
    if (!isHost) return;

    const broadcastGameState = () => {
      players.forEach((player: Player) => {
        if (player.id !== myPlayerId) {
          const personalizedState = createPublicGameState(player.id);

          networkService.sendMessage(
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
    };

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
        dealerSelectionCards: state.dealerSelectionCards,
      }),
      () => broadcastGameState()
    );

    return unsubscribe;
  }, [createPublicGameState, isHost, myPlayerId, players, networkService]);
}
