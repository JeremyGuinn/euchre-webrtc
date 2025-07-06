import type {
  HandlerContext,
  MessageHandler,
  ValidationResult,
} from '~/types/handlers';
import type { MovePlayerMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';

/**
 * Validates the target player exists
 */
const validateTargetPlayerExists = (
  _senderId: string,
  context: HandlerContext,
  message: MovePlayerMessage
): ValidationResult => {
  const { targetPlayerId } = message.payload;
  const targetPlayerExists = context.gameState.players.some(
    player => player.id === targetPlayerId
  );

  if (!targetPlayerExists) {
    return {
      isValid: false,
      reason: `Target player ${targetPlayerId} not found`,
    };
  }

  return { isValid: true };
};

/**
 * Handles MOVE_PLAYER messages sent by the host to change a player's position/team.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The move player message containing the target player ID and new position
 * @param senderId - The ID of the host who moved the player
 * @param context - Handler context with game state and dispatch functions
 */
const handleMovePlayerImpl: MessageHandler<MovePlayerMessage> = (
  message: MovePlayerMessage,
  _senderId: string,
  context: HandlerContext
) => {
  const { dispatch } = context;
  const { targetPlayerId, newPosition } = message.payload;

  dispatch({
    type: 'MOVE_PLAYER',
    payload: { playerId: targetPlayerId, newPosition },
  });
};

export const handleMovePlayer = createHostToClientHandler(
  handleMovePlayerImpl,
  [validateTargetPlayerExists]
);
