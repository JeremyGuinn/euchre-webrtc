import type { RenameTeamMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles RENAME_TEAM messages sent when a player wants to change a team's display name.
 * All players receive these messages to update their local team names.
 *
 * @param message - The rename team message containing the team ID and new name
 * @param senderId - The ID of the player who is renaming the team
 * @param context - Handler context with dispatch functions
 */
export const handleRenameTeam: MessageHandler<RenameTeamMessage> = (
  message,
  senderId,
  context
) => {
  const { dispatch } = context;

  const { teamId, newName } = message.payload;

  // Validate team name (basic sanitization)
  const sanitizedName = newName.trim();
  if (!sanitizedName || sanitizedName.length > 50) {
    return; // Ignore invalid team names
  }

  // Validate that the sender is allowed to rename the team
  // Any player can rename their own team
  const senderPlayer = context.gameState.players.find(p => p.id === senderId);
  if (senderPlayer && senderPlayer.teamId === teamId) {
    dispatch({
      type: 'RENAME_TEAM',
      payload: { teamId, newName: sanitizedName },
    });
  }
};
