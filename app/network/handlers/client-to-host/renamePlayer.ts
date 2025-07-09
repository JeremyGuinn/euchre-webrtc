import type { ClientToHostHandler } from '~/types/handlers';
import type { RenamePlayerMessage } from '~/types/messages';
import { makeNameUnique } from '~/utils/game/playerUtils';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import { validatePlayerExists } from '../validators';

/**
 * Handles RENAME_PLAYER messages sent when a player wants to change their display name.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The rename player message containing the new name
 * @param senderId - The ID of the player who is renaming themselves
 * @param context - Handler context with gameStore actions
 */
const handleRenamePlayerImpl: ClientToHostHandler<RenamePlayerMessage> = (
  message,
  senderId,
  context
) => {
  const { gameStore } = context;
  const { newName } = message.payload;

  // Get current game state from store
  const gameState = gameStore;

  const uniqueName = makeNameUnique(newName, gameState.players, senderId);

  gameStore.renamePlayer(senderId, uniqueName);
};

export const handleRenamePlayer = createClientToHostHandler(handleRenamePlayerImpl, [
  validatePlayerExists,
]);
