import type { HandlerContext } from '~/types/handlers';
import type { ReconnectRequestMessage } from '~/types/messages';

import { createPublicGameState } from '~/utils/gameState';
import { createMessageId } from '~/utils/protocol';
import { createClientToHostHandler } from '../base/clientToHostHandler';

/**
 * Handles RECONNECT_REQUEST messages sent by players trying to reconnect to the game.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The reconnect request containing player name and ID
 * @param senderId - The ID of the player requesting to reconnect
 * @param context - Handler context with game state and dispatch functions
 */
const handleReconnectRequestImpl = (
  message: ReconnectRequestMessage,
  senderId: string,
  context: HandlerContext
) => {
  const { gameState, dispatch, networkManager } = context;
  const { playerName, playerId: originalPlayerId } = message.payload;

  // Find the existing player by their original player ID
  const existingPlayer = gameState.players.find(p => p.id === originalPlayerId);

  if (!existingPlayer) {
    // Player not found in game, treat as error
    networkManager?.sendMessage(
      {
        type: 'ERROR',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {
          message:
            'Player not found in this game. You may be trying to reconnect to the wrong game.',
        },
      },
      senderId
    );
    return;
  }

  // Update the player's ID mapping and connection status
  dispatch({
    type: 'RECONNECT_PLAYER',
    payload: {
      oldPlayerId: originalPlayerId,
      newPlayerId: senderId,
      playerName,
    },
  });

  // Get the updated game state after the reconnection
  const updatedGameState = {
    ...gameState,
    players: gameState.players.map(p =>
      p.id === originalPlayerId
        ? { ...p, id: senderId, name: playerName, isConnected: true }
        : p
    ),
  };

  // Create public game state for the JOIN_RESPONSE (with the reconnecting player's hand)
  const publicGameState = createPublicGameState(updatedGameState, senderId);

  // Send successful reconnection response
  networkManager?.sendMessage(
    {
      type: 'JOIN_RESPONSE',
      timestamp: Date.now(),
      messageId: createMessageId(),
      payload: {
        success: true,
        gameState: publicGameState,
        player: {
          ...existingPlayer,
          id: senderId,
          name: playerName,
          isConnected: true,
        },
      },
    },
    senderId
  );

  // Broadcast player reconnection to other players
  const broadcastGameState = createPublicGameState(updatedGameState);

  networkManager?.sendMessage({
    type: 'PLAYER_JOINED',
    timestamp: Date.now(),
    messageId: createMessageId(),
    payload: {
      player: {
        ...existingPlayer,
        id: senderId,
        name: playerName,
        isConnected: true,
      },
      gameState: broadcastGameState,
    },
  });

  console.log(
    `Player ${playerName} (${originalPlayerId}) reconnected with new peer ID: ${senderId}`
  );
};

export const handleReconnectRequest = createClientToHostHandler(
  handleReconnectRequestImpl,
  [] // No additional validators needed for reconnection
);
