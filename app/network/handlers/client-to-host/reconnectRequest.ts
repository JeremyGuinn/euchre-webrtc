import type { HandlerContext } from '~/types/handlers';
import type { ReconnectRequestMessage } from '~/types/messages';

import { createScopedLogger } from '~/services/loggingService';
import { createPublicGameState } from '~/utils/gameState';
import { createMessageId } from '~/utils/protocol';
import { createClientToHostHandler } from '../base/clientToHostHandler';

const logger = createScopedLogger('reconnectRequest');

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
    // Log detailed information for debugging
    logger.error('Reconnection failed - Player not found', {
      originalPlayerId,
      playerName,
      senderId,
      currentPlayers: gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        isConnected: p.isConnected,
      })),
      gameId: gameState.id,
      gamePhase: gameState.phase,
    });

    // Player not found in game, treat as error
    networkManager?.sendMessage(
      {
        type: 'ERROR',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {
          message: `Player not found in this game. You may be trying to reconnect to the wrong game. Looking for player ID: ${originalPlayerId}`,
        },
      },
      senderId
    );
    return;
  }

  logger.info('Processing player reconnection', {
    originalPlayerId,
    newPlayerId: senderId,
    playerName,
    existingPlayerName: existingPlayer.name,
    gamePhase: gameState.phase,
  });

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

  for (const player of updatedGameState.players) {
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

  logger.info('Player reconnection completed successfully', {
    originalPlayerId,
    newPlayerId: senderId,
    playerName,
    gamePhase: gameState.phase,
  });
};

export const handleReconnectRequest = createClientToHostHandler(
  handleReconnectRequestImpl,
  [] // No additional validators needed for reconnection
);
