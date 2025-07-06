import type { SelectDealerMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';
import type { MessageHandler } from '../types';

const handleSelectDealerImpl: MessageHandler<SelectDealerMessage> = (
  message,
  _senderId,
  context
) => {
  const { dispatch, myPlayerId } = context;
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

/**
 * Handles SELECT_DEALER messages broadcast by the host when dealer selection begins.
 * All players receive this message to transition to the dealer selection phase.
 *
 * @param message - The select dealer message containing the game state
 * @param senderId - The ID of the host who initiated dealer selection
 * @param context - Handler context with dispatch functions
 */
export const handleSelectDealer = createHostToClientHandler(
  handleSelectDealerImpl
);
