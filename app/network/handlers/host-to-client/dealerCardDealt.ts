import type { HostToClientHandler, MessageHandler } from '~/types/handlers';
import type { DealerCardDealtMessage } from '~/types/messages';
import { createHostToClientHandler } from '../base/hostToClientHandler';
import { validateGameOption, validateGamePhase } from '../validators';

const handleDealerCardDealtImpl: HostToClientHandler<DealerCardDealtMessage> = (
  { payload: { playerId, card, cardIndex, isBlackJack } },
  _senderId,
  { gameStore }
) => {
  gameStore.dealerCardDealt(playerId, card, cardIndex, isBlackJack);
};

/**
 * Handles DEALER_CARD_DEALT messages when the host deals a card during first black jack dealer selection.
 * This message is broadcast to all clients to sync the dealing process.
 */
export const handleDealerCardDealt: MessageHandler<DealerCardDealtMessage> =
  createHostToClientHandler(handleDealerCardDealtImpl, [
    validateGamePhase('dealer_selection'),
    validateGameOption('dealerSelection', 'first_black_jack'),
  ]);
