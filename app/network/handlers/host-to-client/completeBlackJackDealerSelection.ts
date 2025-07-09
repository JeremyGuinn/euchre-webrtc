import type { HostToClientHandler } from '~/types/handlers';
import type { CompleteBlackJackDealerSelectionMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';
import { validateGamePhase } from '../validators';

const handleCompleteBlackJackDealerSelectionImpl: HostToClientHandler<
  CompleteBlackJackDealerSelectionMessage
> = (_message, _senderId, { gameStore }) => {
  gameStore.completeBlackjackDealerSelection();
};

/**
 * Handles the completion of black jack dealer selection
 * This transitions from dealer selection to team summary after the black jack animation completes
 */
export const handleCompleteBlackJackDealerSelection = createHostToClientHandler(
  handleCompleteBlackJackDealerSelectionImpl,
  [validateGamePhase('dealer_selection')]
);
