import type { Player } from '~/types/game';
import type { HandlerContext } from '~/types/handlers';
import type { JoinRequestMessage } from '~/types/messages';

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
  const { gameState, dispatch, networkManager } = context;
  const { playerName } = message.payload;

  const uniqueName = makeNameUnique(playerName, gameState.players);

  // Find the first available position (0-3)
  const occupiedPositions = new Set(gameState.players.map(p => p.position));
  const availablePosition = ([0, 1, 2, 3] as const).find(
    pos => !occupiedPositions.has(pos)
  );

  // This should never happen due to validation, but keep for safety
  if (availablePosition === undefined) {
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

  dispatch({ type: 'ADD_PLAYER', payload: { player: newPlayer } });

  // Create the updated game state with the new player
  const updatedGameState = {
    ...gameState,
    players: [...gameState.players, newPlayer],
  };

  // Create public game state for the JOIN_RESPONSE (with the new player's hand if they have one)
  const publicGameState = createPublicGameState(updatedGameState, senderId);

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

  // Create public game state for PLAYER_JOINED broadcast (no specific player hand)
  const broadcastGameState = createPublicGameState(updatedGameState);

  networkManager?.sendMessage({
    type: 'PLAYER_JOINED',
    timestamp: Date.now(),
    messageId: createMessageId(),
    payload: {
      player: newPlayer,
      gameState: broadcastGameState,
    },
  });
};

export const handleJoinRequest = createClientToHostHandler(
  handleJoinRequestImpl,
  [validateGameCapacity, validatePlayerNotAlreadyJoined]
);
