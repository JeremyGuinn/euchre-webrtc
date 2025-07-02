import type { PlayerJoinedMessage } from "../../../types/messages";
import type { MessageHandler } from "../types";

/**
 * Handles PLAYER_JOINED messages broadcast when a new player joins the game.
 * Non-host players process these messages to update their local game state.
 * 
 * @param message - The player joined message containing the new player and updated game state
 * @param senderId - The ID of the host who broadcast this message
 * @param context - Handler context with game state and dispatch functions
 */
export const handlePlayerJoined: MessageHandler<PlayerJoinedMessage> = (message, senderId, context) => {
  const { isHost, dispatch, myPlayerId } = context;

  if (isHost) return; // Host already knows about player joins

  const { gameState: newGameState } = message.payload;

  dispatch({
    type: "SYNC_STATE",
    payload: {
      gameState: newGameState,
      playerHand: newGameState.playerHand,
      receivingPlayerId: myPlayerId,
    },
  });
};
