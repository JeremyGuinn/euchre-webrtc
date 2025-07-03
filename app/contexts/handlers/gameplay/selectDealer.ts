import type { SelectDealerMessage } from '../../../types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles SELECT_DEALER messages broadcast by the host when dealer selection begins.
 * All players receive this message to transition to the dealer selection phase.
 *
 * @param message - The select dealer message containing the game state
 * @param senderId - The ID of the host who initiated dealer selection
 * @param context - Handler context with dispatch functions
 */
export const handleSelectDealer: MessageHandler<SelectDealerMessage> = (
  message,
  senderId,
  context
) => {
  const { isHost, dispatch, myPlayerId } = context;

  if (isHost) return; // Host doesn't receive select dealer messages from others

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
