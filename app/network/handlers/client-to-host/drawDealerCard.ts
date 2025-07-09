import type { ClientToHostHandler } from '~/types/handlers';
import type { DrawDealerCardMessage } from '~/types/messages';
import { createClientToHostHandler } from '../base/clientToHostHandler';
import {
  validateCardsAvailable,
  validatePlayerExists,
  validatePlayerHasNotDrawn,
} from '../validators';

const handleDrawDealerCardImpl: ClientToHostHandler<DrawDealerCardMessage> = (
  { payload: { cardIndex } },
  senderId,
  { gameStore }
) => {
  const availableCards = gameStore.deck!.filter(
    card =>
      !Object.values(gameStore.dealerSelectionCards || {}).some(
        drawnCard => drawnCard.id === card.id
      )
  );

  const defaultIndex = Math.floor(Math.random() * availableCards.length);
  const selectedIndex =
    cardIndex !== undefined && cardIndex >= 0 && cardIndex < availableCards.length
      ? cardIndex
      : defaultIndex;

  gameStore.drawDealerCard(senderId, availableCards[selectedIndex]);
};

/**
 * Handles DRAW_DEALER_CARD messages when a player requests to draw a card for dealer selection.
 * This is a client-to-host message that only the host should process.
 *
 * @param message - The draw dealer card message containing the request from a player
 * @param senderId - The ID of the player who wants to draw a card
 * @param context - Handler context with gameStore actions
 */
export const handleDrawDealerCard = createClientToHostHandler(handleDrawDealerCardImpl, [
  validatePlayerExists,
  validatePlayerHasNotDrawn,
  validateCardsAvailable,
]);
