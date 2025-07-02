import { makeNameUnique } from "~/utils/playerUtils";
import type { RenamePlayerMessage } from "../../../types/messages";
import type { MessageHandler } from "../types";

/**
 * Handles RENAME_PLAYER messages sent when a player wants to change their display name.
 * All players receive these messages to update their local player list.
 * 
 * @param message - The rename player message containing the new name
 * @param senderId - The ID of the player who is renaming themselves
 * @param context - Handler context with dispatch functions
 */
export const handleRenamePlayer: MessageHandler<RenamePlayerMessage> = (message, senderId, context) => {
  const { dispatch, gameState } = context;

  const { newName } = message.payload;

  const uniqueName = makeNameUnique(newName, gameState.players, senderId);

  dispatch({
    type: "RENAME_PLAYER",
    payload: { playerId: senderId, newName: uniqueName }
  });
};
