import type { CompleteBlackJackDealerSelectionMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles the completion of black jack dealer selection
 * This transitions from dealer selection to team summary after the black jack animation completes
 */
export const handleCompleteBlackJackDealerSelection: MessageHandler<
  CompleteBlackJackDealerSelectionMessage
> = (message, _senderId, context) => {
  const { gameState, dispatch } = context;

  // Only process if we're in dealer selection phase
  if (gameState.phase !== 'dealer_selection') {
    console.warn(
      'Received COMPLETE_BLACKJACK_DEALER_SELECTION but not in dealer_selection phase'
    );
    return;
  }

  dispatch({
    type: 'COMPLETE_BLACKJACK_DEALER_SELECTION',
  });
};
