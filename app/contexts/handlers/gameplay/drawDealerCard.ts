import type { DrawDealerCardMessage } from '~/types/messages';
import type { MessageHandler } from '../types';

/**
 * Handles DRAW_DEALER_CARD messages when a player requests to draw a card for dealer selection.
 * If the receiver is the host, they handle the actual card drawing logic.
 * If the receiver is a client, they update their state with the drawn card.
 *
 * @param message - The draw dealer card message containing the request from a player
 * @param senderId - The ID of the player who wants to draw a card
 * @param context - Handler context with dispatch functions
 */
export const handleDrawDealerCard: MessageHandler<DrawDealerCardMessage> = (
  message,
  senderId,
  context
) => {
  const { dispatch, isHost, gameState } = context;

  if (!isHost) return; // Only the host processes draw dealer card messages

  // Check if player has already drawn a card
  if (gameState.dealerSelectionCards?.[senderId]) return;

  // Check if deck is available
  if (!gameState.deck || gameState.deck.length === 0) return;

  const availableCards = gameState.deck.filter(
    card =>
      !Object.values(gameState.dealerSelectionCards || {}).some(
        drawnCard => drawnCard.id === card.id
      )
  );

  if (availableCards.length === 0) return;

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
