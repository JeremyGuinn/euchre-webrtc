import type { HandlerContext } from '~/types/handlers';
import type { DrawDealerCardMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validateCardsAvailable,
  validatePlayerExists,
  validatePlayerHasNotDrawn,
} from '../validators';

const handleDrawDealerCardImpl = (
  message: DrawDealerCardMessage,
  senderId: string,
  context: HandlerContext
) => {
  const { dispatch, gameState } = context;

  const availableCards = gameState.deck!.filter(
    card =>
      !Object.values(gameState.dealerSelectionCards || {}).some(
        drawnCard => drawnCard.id === card.id
      )
  );

  let drawnCard;
  const { cardIndex } = message.payload;

  if (
    cardIndex !== undefined &&
    cardIndex >= 0 &&
    cardIndex < availableCards.length
  ) {
    drawnCard = availableCards[cardIndex];
  } else {
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    drawnCard = availableCards[randomIndex];
  }

  dispatch({
    type: 'DRAW_DEALER_CARD',
    payload: { playerId: senderId, card: drawnCard },
  });
};

/**
 * Handles DRAW_DEALER_CARD messages when a player requests to draw a card for dealer selection.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The draw dealer card message containing the request from a player
 * @param senderId - The ID of the player who wants to draw a card
 * @param context - Handler context with dispatch functions
 */
export const handleDrawDealerCard = createClientToHostHandler(
  handleDrawDealerCardImpl,
  [validatePlayerExists, validatePlayerHasNotDrawn, validateCardsAvailable]
);
