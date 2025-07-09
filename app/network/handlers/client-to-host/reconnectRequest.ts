import type { ReconnectRequestMessage } from '~/types/messages';

import type { ClientToHostHandler } from '~/types/handlers';
import { createMessageId } from '~/utils/protocol';
import { createClientToHostHandler } from '../base/clientToHostHandler';

/**
 * Handles RECONNECT_REQUEST messages sent by players trying to reconnect to the game.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The reconnect request containing player name and ID
 * @param senderId - The ID of the player requesting to reconnect
 * @param context - Handler context with game state and gameStore actions
 */
const handleReconnectRequestImpl: ClientToHostHandler<
  ReconnectRequestMessage
> = (message, senderId, context) => {
  const { gameStore, networkManager } = context;
  const { playerName, playerId: originalPlayerId } = message.payload;

  // Get current game state from store
  const gameState = gameStore;

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
  gameStore.reconnectPlayer(originalPlayerId, senderId, playerName);

  // Create public game state for the JOIN_RESPONSE (with the reconnecting player's hand)
  const publicGameState = gameStore.createPublicGameState(senderId);

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
  const broadcastGameState = gameStore.createPublicGameState();

  for (const player of gameState.players) {
    if (player.id === senderId) continue; // Skip sending to the reconnecting player

    networkManager?.sendMessage(
      {
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
      },
      player.id
    );
  }
};

export const handleReconnectRequest = createClientToHostHandler(
  handleReconnectRequestImpl,
  [] // No additional validators needed for reconnection
);
