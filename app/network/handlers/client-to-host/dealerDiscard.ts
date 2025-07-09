import type { ClientToHostHandler } from '~/types/handlers';
import type { DealerDiscardMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import { validatePlayerExists, validateSenderIsDealer } from '../validators';

const handleDealerDiscardImpl: ClientToHostHandler<DealerDiscardMessage> = (
  message,
  _senderId,
  { gameStore }
) => {
  gameStore.dealerDiscard(message.payload.card);
};

/**
 * Handles DEALER_DISCARD messages when the dealer discards a card after taking up the kitty.
 * This is a client-to-host message that only the host should process.
 * Updates the game state to remove the discarded card from dealer's hand and start play.
 *
 * @param message - The dealer discard message containing the discarded card
 * @param senderId - The ID of the dealer who discarded the card
 * @param context - Handler context with gameStore actions
 */
export const handleDealerDiscard = createClientToHostHandler(handleDealerDiscardImpl, [
  validatePlayerExists,
  validateSenderIsDealer,
]);
