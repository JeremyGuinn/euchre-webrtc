import type { GameStateUpdateMessage } from "../../../types/messages";
import type { MessageHandler } from "../types";

/**
 * Handles GAME_STATE_UPDATE messages broadcast by the host to synchronize game state.
 * Non-host players process these messages to keep their local state in sync.
 * 
 * @param message - The game state update containing the current game state
 * @param senderId - The ID of the host who sent this update
 * @param context - Handler context with dispatch functions
 */
export const handleGameStateUpdate: MessageHandler<GameStateUpdateMessage> = (message, senderId, context) => {
  const { isHost, dispatch, myPlayerId } = context;
  
  if (isHost) return; // Host doesn't receive state updates from others

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
