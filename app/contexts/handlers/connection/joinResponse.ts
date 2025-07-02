import type { JoinResponseMessage } from "../../../types/messages";
import type { MessageHandler } from "../types";

/**
 * Handles JOIN_RESPONSE messages received after requesting to join a game.
 * Non-host players process these messages to sync their state after joining.
 * 
 * @param message - The join response containing success status and game state
 * @param senderId - The ID of the host who sent this response
 * @param context - Handler context with dispatch functions
 */
export const handleJoinResponse: MessageHandler<JoinResponseMessage> = (message, senderId, context) => {
  const { dispatch, myPlayerId } = context;

  const {
    success,
    gameState: newGameState,
    player,
    error,
  } = message.payload;

  if (success && newGameState && player) {
    dispatch({
      type: "SYNC_STATE",
      payload: {
        gameState: newGameState,
        playerHand: newGameState.playerHand,
        receivingPlayerId: myPlayerId,
      },
    });
  } else {
    console.error("Failed to join game:", error);
    throw new Error(error || "Failed to join game");
  }
};
