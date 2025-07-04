import type { DealerCardDealtMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles DEALER_CARD_DEALT messages when the host deals a card during first black jack dealer selection.
 * This message is broadcast to all clients to sync the dealing process.
 */
export const handleDealerCardDealt: MessageHandler<DealerCardDealtMessage> = (
  message,
  _senderId,
  context
) => {
  const { gameState, dispatch } = context;

  // Only process if we're in dealer selection phase
  if (gameState.phase !== 'dealer_selection') {
    console.warn(
      'Received DEALER_CARD_DEALT but not in dealer_selection phase'
    );
    return;
  }

  // Only process if using first black jack method
  if (gameState.options.dealerSelection !== 'first_black_jack') {
    console.warn(
      'Received DEALER_CARD_DEALT but not using first_black_jack method'
    );
    return;
  }

  const { playerId, card, cardIndex, isBlackJack } = message.payload;

  // Dispatch the action to update the game state
  dispatch({
    type: 'DEALER_CARD_DEALT',
    payload: { playerId, card, cardIndex, isBlackJack },
  });
};
