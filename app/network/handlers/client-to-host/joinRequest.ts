import type { Player } from '~/types/game';
import type { JoinRequestMessage } from '~/types/messages';

import { createMessageId } from '~/network/protocol';
import type { TeamIndex } from '~/types/game';
import type { ClientToHostHandler, ValidationResultHandler } from '~/types/handlers';
import { makeNameUnique } from '~/utils/game/playerUtils';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import { validateGameCapacity, validatePlayerNotAlreadyJoined } from '../validators';
import { validateGameCodeMatch } from '../validators/gameStateValidators';
/**
 * Handles JOIN_REQUEST messages sent by players trying to join the game.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The join request containing player name
 * @param senderId - The ID of the player requesting to join
 * @param context - Handler context with game state and gameStore actions
 */
const handleJoinRequestImpl: ClientToHostHandler<JoinRequestMessage> = (
  { payload: { playerName } },
  senderId,
  { gameStore, networkManager }
) => {
  const uniqueName = makeNameUnique(playerName, gameStore.players);

  const occupiedPositions = new Set(gameStore.players.map(p => p.position));
  const availablePosition = ([0, 1, 2, 3] as const).find(pos => !occupiedPositions.has(pos)) ?? 0;

  const newPlayer: Player = {
    id: senderId,
    name: uniqueName,
    isHost: false,
    isConnected: true,
    position: availablePosition,
    teamId: (availablePosition % 2) as TeamIndex,
  };

  gameStore.addPlayer(newPlayer);

  networkManager?.sendMessage(
    {
      type: 'JOIN_RESPONSE',
      timestamp: Date.now(),
      messageId: createMessageId(),
      payload: {
        success: true,
        gameState: gameStore.createPublicGameState(senderId),
        player: newPlayer,
      },
    },
    senderId
  );

  for (const player of gameStore.players) {
    if (player.id === senderId) continue; // Skip sending to the new player

    networkManager?.sendMessage(
      {
        type: 'PLAYER_JOINED',
        timestamp: Date.now(),
        messageId: createMessageId(),
        payload: {
          player: newPlayer,
          gameState: gameStore.createPublicGameState(),
        },
      },
      player.id
    );
  }
};

const failedValidationHandler: ValidationResultHandler<JoinRequestMessage> = (
  result,
  message,
  senderId,
  context
) => {
  context.networkManager?.sendMessage(
    {
      type: 'JOIN_RESPONSE',
      timestamp: Date.now(),
      messageId: createMessageId(),
      payload: {
        success: false,
        error: result.reason,
      },
    },
    senderId
  );
};

export const handleJoinRequest = createClientToHostHandler(
  handleJoinRequestImpl,
  [validateGameCodeMatch, validateGameCapacity, validatePlayerNotAlreadyJoined],
  failedValidationHandler
);
