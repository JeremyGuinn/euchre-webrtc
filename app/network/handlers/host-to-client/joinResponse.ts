import type { JoinResponseMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';
import type { MessageHandler } from '../types';

const handleJoinResponseImpl: MessageHandler<JoinResponseMessage> = (
  message,
  _senderId,
  context
) => {
  const { dispatch, myPlayerId } = context;
  const { success, gameState: newGameState, player, error } = message.payload;

  if (!success || !newGameState || !player) {
    console.error('Failed to join game:', error);
    throw new Error(error || 'Failed to join game');
  }

  dispatch({
    type: 'SYNC_STATE',

    payload: {
      gameState: newGameState,
      playerHand: newGameState.playerHand,
      receivingPlayerId: myPlayerId,
    },
  });
};

/**
 * Handles JOIN_RESPONSE messages received after requesting to join a game.
 * This is a host-to-client message that only non-host players should process.
 *
 * @param message - The join response containing success status and game state
 * @param senderId - The ID of the host who sent this response
 * @param context - Handler context with dispatch functions
 */
export const handleJoinResponse = createHostToClientHandler(
  handleJoinResponseImpl
);
