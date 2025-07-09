import type { HostToClientHandler } from '~/types/handlers';
import type { PlayerJoinedMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handlePlayerJoinedImpl: HostToClientHandler<PlayerJoinedMessage> = (
  { payload: { gameState: newGameState } },
  _senderId,
  { gameStore, myPlayerId }
) => {
  gameStore.syncState(newGameState, newGameState.playerHand, myPlayerId);
};

/**
 * Handles PLAYER_JOINED messages broadcast when a new player joins the game.
 * This is a host-to-client message that only non-host players should process.
 *
 * @param message - The player joined message containing the new player and updated game state
 * @param senderId - The ID of the host who broadcast this message
 * @param context - Handler context with game state and gameStore actions
 */
export const handlePlayerJoined = createHostToClientHandler(
  handlePlayerJoinedImpl
);
