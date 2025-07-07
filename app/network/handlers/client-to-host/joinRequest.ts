import type { Player } from '~/types/game';
import type { HandlerContext } from '~/types/handlers';
import type { JoinRequestMessage } from '~/types/messages';

import { createScopedLogger } from '~/services/loggingService';
import { createPublicGameState } from '~/utils/gameState';
import { makeNameUnique } from '~/utils/playerUtils';
import { createMessageId } from '~/utils/protocol';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validateGameCapacity,
  validatePlayerNotAlreadyJoined,
} from '../validators';

/**
 * Handles JOIN_REQUEST messages sent by players trying to join the game.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The join request containing player name
 * @param senderId - The ID of the player requesting to join
 * @param context - Handler context with game state and dispatch functions
 */
const handleJoinRequestImpl = (
  message: JoinRequestMessage,
  senderId: string,
  context: HandlerContext
) => {
  const logger = createScopedLogger('JoinRequestHandler', {
    senderId,
    messageId: message.messageId,
    timestamp: message.timestamp,
  });

  const { gameState, dispatch, networkManager } = context;
  const { playerName } = message.payload;

  logger.info('Processing join request', {
    requestedPlayerName: playerName,
    currentPlayerCount: gameState.players.length,
    gamePhase: gameState.phase,
  });

  // Validate the request
  try {
    const capacityResult = validateGameCapacity(senderId, context, message);
    if (!capacityResult.isValid) {
      throw new Error(capacityResult.reason);
    }

    const playerResult = validatePlayerNotAlreadyJoined(
      senderId,
      context,
      message
    );
    if (!playerResult.isValid) {
      throw new Error(playerResult.reason);
    }
  } catch (error) {
    logger.warn('Join request validation failed', {
      reason: error instanceof Error ? error.message : String(error),
      requestedPlayerName: playerName,
    });

    networkManager?.sendMessage(
      {
        type: 'ERROR',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {
          message:
            error instanceof Error ? error.message : 'Join request failed',
        },
      },
      senderId
    );
    return;
  }

  const uniqueName = makeNameUnique(playerName, gameState.players);

  if (uniqueName !== playerName) {
    logger.debug('Player name was made unique', {
      originalName: playerName,
      uniqueName,
    });
  }

  // Find the first available position (0-3)
  const occupiedPositions = new Set(gameState.players.map(p => p.position));
  const availablePosition = ([0, 1, 2, 3] as const).find(
    pos => !occupiedPositions.has(pos)
  );

  // This should never happen due to validation, but keep for safety
  if (availablePosition === undefined) {
    logger.error('No available position found despite validation', {
      occupiedPositions: Array.from(occupiedPositions),
      currentPlayerCount: gameState.players.length,
    });

    networkManager?.sendMessage(
      {
        type: 'ERROR',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {
          message: 'Game is full',
        },
      },
      senderId
    );
    return;
  }

  const newPlayer: Player = {
    id: senderId,
    name: uniqueName,
    isHost: false,
    isConnected: true,
    position: availablePosition,
    teamId: (availablePosition % 2) as 0 | 1,
  };

  logger.info('Adding new player to game', {
    playerId: newPlayer.id,
    playerName: newPlayer.name,
    position: newPlayer.position,
    teamId: newPlayer.teamId,
  });

  dispatch({ type: 'ADD_PLAYER', payload: { player: newPlayer } });

  // Create the updated game state with the new player
  const updatedGameState = {
    ...gameState,
    players: [...gameState.players, newPlayer],
  };

  // Create public game state for the JOIN_RESPONSE (with the new player's hand if they have one)
  const publicGameState = createPublicGameState(updatedGameState, senderId);

  logger.debug('Sending join response to new player', {
    playerId: senderId,
    publicGameStatePhase: publicGameState.phase,
  });

  networkManager?.sendMessage(
    {
      type: 'JOIN_RESPONSE',
      timestamp: Date.now(),
      messageId: createMessageId(),
      payload: {
        success: true,
        gameState: publicGameState,
        player: newPlayer,
      },
    },
    senderId
  );

  // Create public game state for PLAYER_JOINED for all players except the new player
  const broadcastGameState = createPublicGameState(updatedGameState);

  logger.debug('Broadcasting player joined to existing players', {
    existingPlayerCount: updatedGameState.players.length - 1,
    newPlayerName: newPlayer.name,
  });

  for (const player of updatedGameState.players) {
    if (player.id === senderId) continue; // Skip sending to the new player

    networkManager?.sendMessage(
      {
        type: 'PLAYER_JOINED',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {
          player: newPlayer,
          gameState: broadcastGameState,
        },
      },
      player.id
    );
  }
};

export const handleJoinRequest = createClientToHostHandler(
  handleJoinRequestImpl,
  [validateGameCapacity, validatePlayerNotAlreadyJoined]
);
