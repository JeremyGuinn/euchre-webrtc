import type { MovePlayerMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles MOVE_PLAYER messages sent by the host to change a player's position/team.
 * All players receive these messages to update their local player positions.
 *
 * @param message - The move player message containing the target player ID and new position
 * @param senderId - The ID of the host who moved the player
 * @param context - Handler context with game state and dispatch functions
 */
export const handleMovePlayer: MessageHandler<MovePlayerMessage> = (
  message,
  senderId,
  context
) => {
  const { gameState, dispatch } = context;

  const { targetPlayerId, newPosition } = message.payload;

  const senderPlayer = gameState.players.find(p => p.id === senderId);
  if (!senderPlayer?.isHost) {
    console.warn(
      `Non-host player ${senderId} attempted to move player ${targetPlayerId}`
    );
    return;
  }

  dispatch({
    type: 'MOVE_PLAYER',
    payload: { playerId: targetPlayerId, newPosition },
  });
};
