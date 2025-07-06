import type { CompleteBlackJackDealerSelectionMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';
import type { MessageHandler } from '../types';
import { validateGamePhase } from '../validators';

const handleCompleteBlackJackDealerSelectionImpl: MessageHandler<
  CompleteBlackJackDealerSelectionMessage
> = (_message, _senderId, context) => {
  const { dispatch } = context;

  dispatch({
    type: 'COMPLETE_BLACKJACK_DEALER_SELECTION',
  });
};

/**
 * Handles the completion of black jack dealer selection
 * This transitions from dealer selection to team summary after the black jack animation completes
 */
export const handleCompleteBlackJackDealerSelection = createHostToClientHandler(
  handleCompleteBlackJackDealerSelectionImpl,
  [validateGamePhase('dealer_selection')]
);
