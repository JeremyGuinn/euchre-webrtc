import type { HandlerContext } from '~/types/handlers';
import type { RenamePlayerMessage } from '~/types/messages';
import { makeNameUnique } from '~/utils/playerUtils';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import { validatePlayerExists } from '../validators';

/**
 * Handles RENAME_PLAYER messages sent when a player wants to change their display name.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The rename player message containing the new name
 * @param senderId - The ID of the player who is renaming themselves
 * @param context - Handler context with dispatch functions
 */
const handleRenamePlayerImpl = (
  message: RenamePlayerMessage,
  senderId: string,
  context: HandlerContext
) => {
  const { dispatch, gameState } = context;
  const { newName } = message.payload;

  const uniqueName = makeNameUnique(newName, gameState.players, senderId);

  dispatch({
    type: 'RENAME_PLAYER',
    payload: { playerId: senderId, newName: uniqueName },
  });
};

export const handleRenamePlayer = createClientToHostHandler(
  handleRenamePlayerImpl,
  [validatePlayerExists]
);
