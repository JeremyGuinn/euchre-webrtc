import type { HostToClientHandler } from '~/types/handlers';
import type { PlayerLeftMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handlePlayerLeftImpl: HostToClientHandler<PlayerLeftMessage> = (
  { payload: { gameState: newGameState } },
  _senderId,
  { gameStore, myPlayerId }
) => {
  gameStore.syncState(newGameState, newGameState.playerHand, myPlayerId);
};

/**
 * Handles PLAYER_LEFT messages broadcast when a player leaves the game.
 * All players process these messages to update their local game state.
 *
 * @param message - The player left message containing the player ID and updated game state
 * @param senderId - The ID of the host who broadcast this message
 * @param context - Handler context with gameStore actions
 */
export const handlePlayerLeft = createHostToClientHandler(handlePlayerLeftImpl);
