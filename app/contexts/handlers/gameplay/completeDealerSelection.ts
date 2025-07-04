import type { CompleteDealerSelectionMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles COMPLETE_DEALER_SELECTION messages when dealer selection is complete.
 * Updates the game state with the final team arrangements and dealer assignment.
 *
 * @param message - The complete dealer selection message containing the final game state
 * @param senderId - The ID of the host who completed dealer selection
 * @param context - Handler context with dispatch functions
 */
export const handleCompleteDealerSelection: MessageHandler<
  CompleteDealerSelectionMessage
> = (message, senderId, context) => {
  const { isHost, dispatch, myPlayerId } = context;

  if (isHost) return; // Host doesn't receive complete dealer selection messages from others

  const { gameState: newGameState } = message.payload;

  dispatch({
    type: 'SYNC_STATE',
    payload: {
      gameState: newGameState,
      playerHand: newGameState.playerHand,
      receivingPlayerId: myPlayerId,
    },
  });
};
