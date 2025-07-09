import type { HostToClientHandler } from '~/types/handlers';
import type { GameStateUpdateMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handleGameStateUpdateImpl: HostToClientHandler<GameStateUpdateMessage> = (
  { payload: { gameState: newGameState } },
  _senderId,
  { gameStore, myPlayerId }
) => {
  gameStore.syncState(newGameState, newGameState.playerHand, myPlayerId);
};

/**
 * Handles GAME_STATE_UPDATE messages broadcast by the host to synchronize game state.
 * This is a host-to-client message that only non-host players should process.
 *
 * @param message - The game state update containing the current game state
 * @param senderId - The ID of the host who sent this update
 * @param context - Handler context with gameStore actions
 */
export const handleGameStateUpdate = createHostToClientHandler(handleGameStateUpdateImpl);
