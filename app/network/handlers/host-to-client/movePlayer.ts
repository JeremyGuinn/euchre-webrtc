import type { HostToClientHandler } from '~/types/handlers';
import type { MovePlayerMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';
import { validateTargetPlayerExists } from '../validators/playerValidators';

/**
 * Handles MOVE_PLAYER messages sent by the host to change a player's position/team.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The move player message containing the target player ID and new position
 * @param senderId - The ID of the host who moved the player
 * @param context - Handler context with game state and gameStore actions
 */
const handleMovePlayerImpl: HostToClientHandler<MovePlayerMessage> = (
  { payload: { targetPlayerId, newPosition } },
  _senderId,
  { gameStore }
) => {
  gameStore.movePlayer(targetPlayerId, newPosition);
};

export const handleMovePlayer = createHostToClientHandler(
  handleMovePlayerImpl,
  [validateTargetPlayerExists]
);
