import { createMessageId } from "~/utils/protocol";
import type { Player } from "../../../types/game";
import type { JoinRequestMessage } from "../../../types/messages";
import type { MessageHandler } from "../types";

/**
 * Handles JOIN_REQUEST messages sent by players trying to join the game.
 * Only hosts process these messages.
 *
 * @param message - The join request containing player name
 * @param senderId - The ID of the player requesting to join
 * @param context - Handler context with game state and dispatch functions
 */
export const handleJoinRequest: MessageHandler<JoinRequestMessage> = (
  message,
  senderId,
  context
) => {
  const { gameState, isHost, dispatch, networkManager } = context;

  if (!isHost) return;

  const { playerName } = message.payload;

  if (gameState.players.length >= 4) {
    networkManager?.sendMessage(
      {
        type: "ERROR",
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {
          message: "Game is full",
        },
      },
      senderId
    );
    return;
  }

  const newPlayer: Player = {
    id: senderId,
    name: playerName,
    isHost: false,
    isConnected: true,
    position: gameState.players.length as 0 | 1 | 2 | 3,
    teamId: (gameState.players.length % 2) as 0 | 1,
  };

  dispatch({ type: "ADD_PLAYER", payload: { player: newPlayer } });

  networkManager?.sendMessage({
    type: "JOIN_RESPONSE",
    timestamp: Date.now(),
    messageId: createMessageId(),
    payload: {
      success: true,
      gameState,
      player: newPlayer,
    },
  }, senderId);

  const updatedGameState = {
    ...gameState,
    players: [...gameState.players, newPlayer],
  };

  networkManager?.sendMessage({
    type: "PLAYER_JOINED",
    timestamp: Date.now(),
    messageId: createMessageId(),
    payload: {
      player: newPlayer,
      gameState: updatedGameState,
    },
  });
};
