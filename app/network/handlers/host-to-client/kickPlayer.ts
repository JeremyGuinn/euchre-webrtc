import type { HostToClientHandler } from '~/types/handlers';
import type { KickPlayerMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

const handleKickPlayerImpl: HostToClientHandler<KickPlayerMessage> = (
  { payload: { targetPlayerId } },
  _senderId,
  { myPlayerId, gameStore, handleKicked }
) => {
  gameStore.kickPlayer(targetPlayerId);

  if (targetPlayerId === myPlayerId) {
    handleKicked('You have been removed from the game by the host.');
  }
};

/**
 * Handles KICK_PLAYER messages sent by the host to remove a player from the game.
 * This is a host-to-client message that all players should process to update their local state.
 * The kicked player will also disconnect and be redirected.
 *
 * @param message - The kick player message containing the target player ID
 * @param senderId - The ID of the host who kicked the player
 * @param context - Handler context with game state, player ID, and connection functions
 */
export const handleKickPlayer = createHostToClientHandler(handleKickPlayerImpl);
