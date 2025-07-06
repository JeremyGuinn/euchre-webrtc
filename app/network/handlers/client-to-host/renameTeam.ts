import type { HandlerContext } from '~/types/handlers';
import type { RenameTeamMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validatePlayerCanRenameTeam,
  validatePlayerExists,
  validateTeamName,
} from '../validators';

/**
 * Handles RENAME_TEAM messages sent when a player wants to change a team's display name.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The rename team message containing the team ID and new name
 * @param senderId - The ID of the player who is renaming the team
 * @param context - Handler context with dispatch functions
 */
const handleRenameTeamImpl = (
  message: RenameTeamMessage,
  senderId: string,
  context: HandlerContext
) => {
  const { dispatch } = context;
  const { teamId, newName } = message.payload;

  const sanitizedName = newName.trim();

  dispatch({
    type: 'RENAME_TEAM',
    payload: { teamId, newName: sanitizedName },
  });
};

export const handleRenameTeam = createClientToHostHandler(
  handleRenameTeamImpl,
  [validatePlayerExists, validateTeamName, validatePlayerCanRenameTeam]
);
